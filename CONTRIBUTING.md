# Contributing to Easy Calories

## Branch Strategy (GitFlow)

| Branch | Purpose |
|--------|---------|
| `main` | Production — deploys automatically to Firebase Hosting |
| `develop` | Integration branch — all features merge here first |
| `feature/*` | New features — branch from `develop` |
| `fix/*` | Bug fixes — branch from `develop` |
| `release/*` | Release candidates — branch from `develop`, merge to `main` + `develop` |
| `hotfix/*` | Critical prod fixes — branch from `main`, merge to `main` + `develop` |

## Workflow

1. `git checkout develop && git pull`
2. `git checkout -b feature/my-feature`
3. Develop + commit
4. Open PR to `develop`
5. After review → merge to `develop`
6. When ready to release: branch `release/v1.x.x` from `develop`
7. Final testing → merge to `main` (triggers auto-deploy) + `develop`

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation only
- `style:` formatting, no logic change
- `refactor:` code restructure
- `test:` adding tests
- `chore:` build/config changes
