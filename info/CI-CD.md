# Setting Up CI/CD for AI Nexus (GitHub Actions → Cloud Run)

This guide wires up a GitHub Actions workflow that automatically rebuilds and redeploys AI Nexus
to Cloud Run every time you push to `main`, so you stop having to run the manual
`docker build` → `docker push` → `gcloud run deploy` sequence by hand every time you want a code
change to actually show up on the live site.

## Prerequisite: a working deployment, already confirmed

**Do not start this guide until `deployment.md` is completely finished and Step 7 there has
confirmed the app actually works** (backend logs show it connected to Postgres and finished
seeding, and the frontend URL loads and answers questions in your browser). This guide has no
steps of its own for creating the Cloud Run services, the Postgres database, or the Secret
Manager secrets: it assumes `backend`, `python-service` and `frontend` already exist and are
already running, and it only automates *redeploying new code* onto them.

If you haven't done that yet: stop here, go finish every step in `deployment.md` first, confirm
the live site works in your browser, and come back to this file once that's done. Every command
below assumes the exact project, region, image names and secret names `deployment.md` created.

Same conventions as `deployment.md`: **PowerShell**, one command at a time, `YOUR_PROJECT_ID`
instead of angle-bracket placeholders, and this guide's own commands additionally use
**`Karti722/ai-nexus`**, your actual GitHub repo, wherever the repo name matters (restricting who
can use the credentials this guide creates).

---

## What this automates, and what it deliberately doesn't

Every push to `main` will: build fresh `python-service`, `backend` and `frontend` images, each
tagged with the commit's SHA (not `:latest`, unlike the manual steps — see the workflow file's own
comments for why); push them to the same Artifact Registry repo `deployment.md` created; and
redeploy each Cloud Run service onto its new image, in the same dependency order `deployment.md`
used (`python-service` before `backend`, `backend` before `frontend`, so `backend` always points at
a `python-service` that's already running the new code).

It does **not** create secrets, IAM bindings, the database, or the services themselves, and it
does **not** touch anything if a push doesn't change anything deployable (e.g. editing only this
file). Rolling back means re-running the workflow for an older commit (or re-running
`gcloud run deploy` by hand with an older SHA-tagged image, since every past build stays pullable
by its exact tag).

---

## Step 1: Create a dedicated service account for GitHub Actions to use

**Where: your local terminal, in the `ai-nexus` root folder** (same folder `deployment.md` had you
working in; these commands don't care which folder you're in, but staying put is one less thing to
think about).

Using a brand-new, narrowly-scoped service account here, rather than your own personal `gcloud`
identity from `deployment.md`, is deliberate: if these credentials were ever misused, the blast
radius is limited to exactly the three permissions below, not everything your own account can do.

0. Enable the IAM Service Account Credentials API. Workload Identity Federation (Step 2 below)
   uses it to exchange GitHub's token for temporary GCP credentials; without it, the workflow's
   `google-github-actions/auth` step fails with `PERMISSION_DENIED: IAM Service Account
   Credentials API has not been used in project ... or it is disabled`, this isn't one of the
   three APIs `deployment.md` Step 0 already enabled:
   ```powershell
   gcloud services enable iamcredentials.googleapis.com --project=YOUR_PROJECT_ID
   ```
1. Create the service account:
   ```powershell
   gcloud iam service-accounts create github-actions-deployer `
     --project=YOUR_PROJECT_ID `
     --display-name="GitHub Actions CI/CD deployer"
   ```
2. Grant it permission to deploy Cloud Run services:
   ```powershell
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID `
     --member="serviceAccount:github-actions-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" `
     --role="roles/run.admin"
   ```
3. Grant it permission to push images to Artifact Registry:
   ```powershell
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID `
     --member="serviceAccount:github-actions-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" `
     --role="roles/artifactregistry.writer"
   ```
4. Grant it permission to act as the runtime service account Cloud Run services run under
   (`gcloud run deploy` itself needs this on whoever's running the command, the same way your own
   account already had it implicitly back in `deployment.md`):
   ```powershell
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID `
     --member="serviceAccount:github-actions-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" `
     --role="roles/iam.serviceAccountUser"
   ```

## Step 2: Set up Workload Identity Federation (no downloadable key needed)

**Where: your local terminal, in the `ai-nexus` root folder.**

The old-fashioned way to let GitHub Actions authenticate to GCP is downloading a service account's
JSON key file and pasting its contents into a GitHub secret, a long-lived credential that works
forever if it ever leaks. Workload Identity Federation (WIF) avoids that entirely: GitHub signs a
short-lived identity token proving "this run really is `Karti722/ai-nexus`" for every workflow run,
and GCP trades that token for temporary access, scoped to exactly this repo, with nothing
long-lived to leak in the first place.

1. Create a Workload Identity Pool, a container for one or more identity providers:
   ```powershell
   gcloud iam workload-identity-pools create "github-actions-pool" `
     --project=YOUR_PROJECT_ID `
     --location="global" `
     --display-name="GitHub Actions Pool"
   ```
2. Create an OIDC provider inside that pool, pointed at GitHub's own token issuer, **restricted to
   this specific repo** via `--attribute-condition`, the step that actually enforces "only this
   repo's workflows can use this," not just an unenforced convention:
   ```powershell
   gcloud iam workload-identity-pools providers create-oidc "github-actions-provider" `
     --project=YOUR_PROJECT_ID `
     --location="global" `
     --workload-identity-pool="github-actions-pool" `
     --display-name="GitHub Actions Provider" `
     --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" `
     --issuer-uri="https://token.actions.githubusercontent.com" `
     --attribute-condition="assertion.repository=='Karti722/ai-nexus'"
   ```
3. Save the pool's full resource name into a variable, you need it in the next step:
   ```powershell
   $poolId = gcloud iam workload-identity-pools describe "github-actions-pool" `
     --project=YOUR_PROJECT_ID --location="global" --format="value(name)"
   ```
4. Allow workflows from `Karti722/ai-nexus` specifically to impersonate the service account from
   Step 1:
   ```powershell
   gcloud iam service-accounts add-iam-policy-binding `
     "github-actions-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" `
     --project=YOUR_PROJECT_ID `
     --role="roles/iam.workloadIdentityUser" `
     --member="principalSet://iam.googleapis.com/$poolId/attribute.repository/Karti722/ai-nexus"
   ```
5. Print the provider's full resource name. Copy this exact string, you'll paste it into a GitHub
   repository variable in Step 3:
   ```powershell
   gcloud iam workload-identity-pools providers describe "github-actions-provider" `
     --project=YOUR_PROJECT_ID `
     --location="global" `
     --workload-identity-pool="github-actions-pool" `
     --format="value(name)"
   ```
   It looks like `projects/1234567890/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider`.

## Step 3: Add three variables to the GitHub repository

**Where: your browser**, at `https://github.com/Karti722/ai-nexus/settings/variables/actions`
(or: repo → **Settings** → **Secrets and variables** → **Actions** → **Variables** tab → **New
repository variable**).

None of these three values are actually secret (they're resource identifiers, not credentials, the
entire point of WIF), so they're stored as repository **variables**, not secrets:

| Variable name | Value |
|---|---|
| `GCP_PROJECT_ID` | `YOUR_PROJECT_ID` (the same one from every `deployment.md` command) |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | The full provider resource name printed at the end of Step 2 |
| `GCP_SERVICE_ACCOUNT` | `github-actions-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com` |

The workflow file below reads all three as `${{ vars.GCP_PROJECT_ID }}`,
`${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}` and `${{ vars.GCP_SERVICE_ACCOUNT }}`.

## Step 4: The workflow file itself

Already written for you at `.github/workflows/deploy.yml`, nothing left to create. Skim through
its own comments once, they explain exactly why each step exists (in particular, why images are
tagged by commit SHA instead of `:latest`, and why `id-token: write` is the one permission this
whole setup hinges on). Commit it and push it to `main` along with everything else, the same way
you'd commit any other change.

## Step 5: Test it

**Where: your browser**, at `https://github.com/Karti722/ai-nexus/actions`.

Push any small change to `main` (even just this file). Within a few seconds you should see a new
"Deploy to Cloud Run" run appear. Click into it and watch each step; the whole thing typically
takes a few minutes, most of it spent on the three `docker build` steps. If it finishes green,
open your deployed frontend URL and confirm nothing broke, the exact same check Step 7 of
`deployment.md` had you do by hand.

---

## Good to know

- **This workflow runs on every push to `main`, with no manual approval step.** That's a
  deliberate choice for a personal/portfolio project; if you ever want a pause-and-confirm step
  before deploying, GitHub Environments support required reviewers, add one around the `deploy`
  job if you want that later.
- **The `github-actions-deployer` service account can only do three things**: deploy Cloud Run
  services, push to Artifact Registry, and act as the runtime service account. It cannot read your
  Secret Manager secrets, touch Postgres directly, or do anything outside those three roles.
- **Losing the GitHub repo doesn't leak a credential.** There's no downloadable key anywhere in
  this setup; the trust relationship only exists between GCP and GitHub's own token issuer, scoped
  to this exact repo name.
- **If a run fails on a `gcloud run deploy` step**, the most common cause is one of the three
  repository variables in Step 3 being mistyped; double-check them against Step 2's exact output
  before re-running.

---

## Removing this later

If you ever want to undo just the CI/CD piece (keeping the deployed app itself untouched):

1. Delete the workflow file, `.github/workflows/deploy.yml`, and commit that.
2. **(Your local terminal)** Delete the Workload Identity Pool (this also deletes the provider
   inside it, no separate step needed):
   ```powershell
   gcloud iam workload-identity-pools delete "github-actions-pool" --project=YOUR_PROJECT_ID --location="global"
   ```
3. **(Your local terminal)** Delete the service account:
   ```powershell
   gcloud iam service-accounts delete "github-actions-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" --project=YOUR_PROJECT_ID
   ```
4. **(Your browser)** Remove the three repository variables from Step 3, the same settings page
   you added them on.

Each `gcloud ... delete` command above asks for a `y`/`N` confirmation before it actually deletes
anything.
