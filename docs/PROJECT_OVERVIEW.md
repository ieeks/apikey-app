# Project Overview

## Purpose
Isla is a local-first API secret manager prototype with workspace and environment organization.

## Current Stack
- React 18
- Vite 7
- Plain CSS
- Vitest + Testing Library

## Current User Flows
1. Unlock app (Face ID / PIN / Passphrase / Tap)
2. Workspace dashboard (search, recent list, create, rename)
3. Secrets list by workspace (search, copy, select/delete)
4. Add secret and inline edit secret

## Security & UX Baseline
- Secret values are masked in list views.
- Copy action copies the real secret value.
- Add/Edit value fields are hidden by default (`password`) with temporary reveal (`Reveal 8s`).
- Auto-lock after 5 minutes inactivity.
- App always starts locked.
- Important: This is a UX prototype. There is no real authentication, and there is no encryption at rest. Secrets are persisted as plaintext in `localStorage` and are readable by any JavaScript running on this origin.

## Persistence
- localStorage-backed state (`isla_state_v1`) for core app data.

## File Map
- `src/App.jsx`: Main flows, state, dialogs, security logic
- `src/styles.css`: UI system, components, focus/accessibility styles
- `src/App.test.jsx`: Critical flow tests
- `src/assets/isla-logo.svg`: Brand icon
- `.github/workflows/deploy-pages.yml`: GitHub Pages deploy workflow
