# Isla — API Vault

A personal web app for storing and copying API keys, organised by workspace and environment.

## Stack

- React + Vite
- Firebase Auth (Google Sign-In)
- Firestore (vault sync)
- Deployed to GitHub Pages

## Setup

```bash
npm install
npm run dev      # localhost:5173
npm run build    # production build
npm test         # vitest
```

## Deployment

Pushes to `main` trigger a GitHub Actions workflow that builds the app and deploys to GitHub Pages. The base path is set via `VITE_BASE_PATH` in the workflow.

## Notes

- Secret values are stored **unencrypted** in Firestore — do not use real production keys
- Access is restricted to the email allowlist in `src/AuthGate.jsx`
- The lock screen is UI-only (no biometric or PIN auth)
