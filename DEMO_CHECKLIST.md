# Launch Review Checklist

Use this checklist before sharing the repository, recording a walkthrough, or tagging a release.

## Repository Hygiene

- [ ] `README.md` reflects the current scope and entry points.
- [ ] Env examples contain placeholders only.
- [ ] No local `.env` files, secrets, or generated audit data are staged.
- [ ] `CHANGELOG.md` includes the current release notes.

## Local Validation

- [ ] `npm run build` passes from the repo root.
- [ ] `npm test` passes from the repo root.
- [ ] `npm run dev` starts the router, wrappers, and dashboard together.
- [ ] The dashboard loads on `http://localhost:5173/dashboard`.

## Runtime Smoke Test

- [ ] Submit a prompt and confirm a provider is selected.
- [ ] Confirm a receipt appears with an Arc explorer link.
- [ ] Review Billing, Requests, Providers, and Audit pages for populated data.
- [ ] Toggle allowlist or policy settings and verify the backend reflects the change.

## Release Readiness

- [ ] CI is green on the branch you plan to publish.
- [ ] Placeholder webhook URLs and sample identities are acceptable for a public repo.
- [ ] Any archival assets that should not ship are removed or relocated.
