# Pre-Commit Checklist

Use this before your first public commit/push.

## 1) Security
- [ ] `.env` is not committed
- [ ] Secrets/API keys are rotated if they were ever exposed
- [ ] No backend credentials or private endpoints are present in repo/files

## 2) Project Health
- [ ] Install dependencies: `pnpm install`
- [ ] Type check passes: `pnpm run check`
- [ ] Tests pass: `pnpm test`
- [ ] Production build succeeds: `pnpm run build`

## 3) Repository Hygiene
- [ ] Removed unused files/dependencies
- [ ] README is accurate and up to date
- [ ] `.gitignore` covers local/runtime artifacts
- [ ] Added root `LICENSE` file (recommended for GitHub)

## 4) Optional but Recommended
- [ ] Add `CONTRIBUTING.md`
- [ ] Add `SECURITY.md`
- [ ] Add branch protection and required checks in GitHub settings
