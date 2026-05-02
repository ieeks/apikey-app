# Developer Notes

## State Ownership (`src/App.jsx`)
- Core data:
  - `secrets`
  - `workspaces`
  - `workspace`
  - `screen`
- Security/UI state:
  - `locked`
  - `lastCopiedAt`
  - `editingId`
  - `revealEditValue`
- Dialog state:
  - `showEditor`
  - `showWorkspaceSheet`
  - `renameTarget`
  - `showDelete`

## Data Rules
- Rename workspace updates:
  - workspace list entry
  - all linked secret records
- Add secret auto-creates workspace if missing.
- Secret list value is always rendered masked (`maskSecret(...)`).
- Copy action always uses raw `value`.

## Security Rules
- App auto-locks after `AUTO_LOCK_MS` (5 minutes) without interaction.
- Add/Edit value fields default to hidden; reveal is temporary (`8s`).
- Lock state is not persisted.

## Persistence
- Storage key: `isla_state_v1`
- Persisted fields:
  - `lockMode`
  - `screen`
  - `workspace`
  - `workspaces`
  - `secrets`

## Testing
- Framework: Vitest + Testing Library
- Setup file: `vitest.setup.js`
- Test file: `src/App.test.jsx`

## Deploy
- Vite `base` is configurable via `VITE_BASE_PATH`.
- GitHub Pages workflow lives in `.github/workflows/deploy-pages.yml`.
