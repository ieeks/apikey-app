# Isla — API Vault (CLAUDE.md)

## What this is
A React/Vite web app for storing and copying API keys. Deployed to GitHub Pages at `manuel-app.dev`. Firebase is used for Google Auth and Firestore sync.

## Running locally
```bash
npm install
npm run dev       # dev server
npm run build     # production build
npm test          # vitest
```

## Architecture
- **`src/App.jsx`** — entire app in one file: all state, all components
- **`src/AuthGate.jsx`** — Google sign-in, email allowlist
- **`src/firebase.js`** — Firebase config (auth, firestore, google provider)
- **`src/styles.css`** — all styles, no CSS-in-JS
- **`index.html`** — CSP meta tag, inline SVG favicon

## Firebase / Auth
- Google OAuth via popup (`signInWithPopup`)
- Allowed emails are hardcoded in `AuthGate.jsx` → `ALLOWED_EMAILS`
- Vault is loaded/saved to Firestore at `vaults/{uid}` with 800ms debounce
- CSP in `index.html` must include `apis.google.com`, `accounts.google.com`, Firebase domains

## Data model
```js
// Secret
{ id, name, value, env: 'prod'|'staging'|'dev', workspace: string }

// Vault document (Firestore)
{ version: 1, screen, workspace, workspaces: string[], secrets: Secret[], hideSecurityNotice: bool }
```

## Key decisions made (session 2025-05-18)
- **Category removed** — was redundant with Workspace; secrets list is now flat
- **Lock screen** simplified to single unlock button (fake PIN/passphrase/Face ID modes removed)
- **Clipboard auto-clear** — 30s after copy, also cleared on relock
- **Swipe-to-close** on all sheets uses non-passive `touchmove` listener (passive React events can't call `preventDefault`, which caused browser pull-to-refresh to trigger instead)
- **CSP** — `frame-ancestors` is ignored in `<meta>` tags (browser limitation); only works via HTTP response header

## Sheet components
All bottom sheets (`AddSheet`, `WorkspaceSheet`, `RenameWorkspaceSheet`, `DeleteSecretsSheet`, `DeleteWorkspaceSheet`) use `useSwipeClose(onClose)` which returns a `ref` and attaches non-passive touch listeners for swipe-to-close.

## Deployment
GitHub Actions workflow builds with `VITE_BASE_PATH="/${repo}/"` and deploys to GitHub Pages. The `vite.config.js` reads `VITE_BASE_PATH` from env.

## Known limitations
- Secrets stored **unencrypted** in Firestore (security notice shown in UI)
- Lock screen is UX-only — no real PIN/biometric auth
- Single-user (allowlist in source code)
