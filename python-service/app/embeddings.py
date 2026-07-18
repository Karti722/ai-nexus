"""
Text embedding generation for the RAG pipeline.

This uses a deterministic hashing ("bag of words") embedding so the whole
demo installs and runs with zero downloaded ML models and no GPU/API key:
`pip install -r requirements.txt` is the entire setup. It captures enough
keyword-level semantic similarity to make the RAG demo's retrieval results
sensible.

Common English stopwords ("what", "is", "the", ...) are dropped before
hashing. Without this, two questions phrased the same way but about
unrelated topics (e.g. "What is the capital of France?" vs. "What is the
Model Context Protocol?") share enough filler words to score as more
"similar" than an actual paraphrase using different content words (e.g.
"Can you explain MCP to me?"), which is backwards for anything keying on
meaning: semantic caching (semantic_cache.py), RAG retrieval, extractive
summarization (summarizer.py) and the eval metric (eval.py) all embed text
through this one function, so this fix applies everywhere at once, not
just one demo page.

Bag-of-words still can't catch true synonymy with zero shared words, "MCP"
and "Model Context Protocol" are the same three content words to a human
but different literal tokens to a hasher. Rather than reach for a full
embedding model just to fix that, a small acronym-expansion table handles
the specific case this app actually teaches: when a known acronym token is
seen (e.g. "mcp"), its spelled-out content words ("model", "context",
"protocol") are hashed in alongside it, so a query using the acronym and
one using the full term now land close together. This only covers the
acronyms this app's own glossary defines (see frontend/app/glossary), it's
a targeted patch for known domain vocabulary, not general synonym
detection; two unrelated ways of phrasing the same idea with neither
recognized acronym nor shared words still won't match, that part still
needs a real embedding model. To upgrade to one, swap the body of
`embed_text` for something like:

    from sentence_transformers import SentenceTransformer
    _model = SentenceTransformer("all-MiniLM-L6-v2")
    def embed_text(text: str) -> list[float]:
        return _model.encode(text).tolist()

or call OpenAI's `/embeddings` endpoint. Everything else in this service
(the FastAPI route, the Node.js client that calls it) stays unchanged
because the interface is just "text in, float vector out".

With a fixed number of dimensions, two unrelated words can hash into the
same bucket by pure coincidence (e.g. "bake" and "programming" collide at
256 dims), making two otherwise-unrelated queries look spuriously similar.
This is an inherent cost of fixed-width feature hashing, never fully
eliminated, but raising EMBEDDING_DIMS makes it considerably less likely.
`backend/src/rag/embeddingsClient.ts`'s `localHashEmbedding` is a second,
independent implementation of this exact algorithm (used as a fallback
when this service is unreachable) and must be kept in sync with this file:
same dimension count, same stopword list, same acronym table, or the two
paths would silently return different similarity scores for identical
text depending on which one happened to serve a given request.
"""

import re
from typing import List

EMBEDDING_DIMS = 1024
_TOKEN_RE = re.compile(r"[a-z0-9]+")

# Standard short English stopword list: articles, pronouns, prepositions,
# auxiliary verbs and other high-frequency function words that carry
# structure but not topic, so they're excluded from the bag-of-words count.
_STOPWORDS = frozenset(
    """
    a an the this that these those
    i you he she it we they me him her us them my your his its our their
    what which who whom
    is are was were be been being am do does did doing
    have has had having
    to of in on at by for with about against between into through during
    before after above below from up down out off over under
    again further then once here there when where why how
    all any both each few more most other some such
    no nor not only own same so than too very
    can will just should now
    and or but if as
    """.split()
)

# Acronym -> spelled-out content words, sourced from this app's own glossary
# (frontend/app/glossary/page.tsx), so a query using either form hashes into
# overlapping buckets. Deliberately small and specific to this app's domain
# vocabulary, not a general-purpose synonym dictionary.
_ACRONYM_EXPANSIONS = {
    "mcp": ("model", "context", "protocol"),
    "rag": ("retrieval", "augmented", "generation"),
    "llm": ("large", "language", "model"),
    "bpe": ("byte", "pair", "encoding"),
    "hnsw": ("hierarchical", "navigable", "small", "world"),
    "api": ("application", "programming", "interface"),
}


def _hash_str(value: str) -> int:
    h = 0
    for ch in value:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    return h


def _acronym_expansion(word: str) -> tuple:
    """Looks up `word` in the acronym table, also trying it with a trailing
    "s" stripped first, so a plural like "LLMs" or "APIs" still expands the
    same way its singular form does."""
    if word in _ACRONYM_EXPANSIONS:
        return _ACRONYM_EXPANSIONS[word]
    if word.endswith("s") and word[:-1] in _ACRONYM_EXPANSIONS:
        return _ACRONYM_EXPANSIONS[word[:-1]]
    return ()


def embed_text(text: str, dims: int = EMBEDDING_DIMS) -> List[float]:
    vector = [0.0] * dims
    for word in _TOKEN_RE.findall(text.lower()):
        for token in (word, *_acronym_expansion(word)):
            if token in _STOPWORDS:
                continue
            vector[_hash_str(token) % dims] += 1.0

    norm = sum(v * v for v in vector) ** 0.5 or 1.0
    return [v / norm for v in vector]


def embed_batch(texts: List[str]) -> List[List[float]]:
    return [embed_text(t) for t in texts]
