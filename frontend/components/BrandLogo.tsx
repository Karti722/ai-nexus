import Link from "next/link";
import { BookIcon } from "@/components/BookIcon";
import { HomeIllustration } from "@/components/HomeIllustration";

/**
 * The nav bar's brand mark: a plain, non-interactive swap by route. A
 * closed, brown-covered book on the home page (the book hasn't been
 * "opened" yet), an open book (the homepage illustration's art, small)
 * everywhere else. Always links back to "/". The interactive open-on-hover
 * version of this same swap lives on the homepage's own hero illustration
 * instead (see LandingBook.tsx) — the nav bar stays a quiet route
 * indicator, not a second copy of that interaction.
 */
export function BrandLogo({ isHome }: { isHome: boolean }) {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2 whitespace-nowrap font-display text-base font-bold tracking-tight text-paper-ink sm:text-lg"
    >
      {isHome ? (
        <BookIcon className="h-6 w-auto shrink-0" />
      ) : (
        <HomeIllustration className="h-6 w-auto shrink-0" decorative />
      )}
      AI Nexus
    </Link>
  );
}
