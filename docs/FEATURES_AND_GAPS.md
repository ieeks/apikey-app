# Features and Gaps

## Implemented Features
- Lock variants (Face ID, PIN, Passphrase, Tap)
- Workspace dashboard:
  - live search
  - recently accessed list
  - create workspace
  - rename workspace
- Secrets list:
  - environment tags
  - search
  - inline edit (name, value, env)
  - masked value display
  - copy secret value
  - select mode + bulk delete confirmation
- Add secret sheet
- Success/error toast feedback for add/rename/delete/copy validations
- Empty states for key screens
- Accessibility/Keyboard:
  - visible focus states
  - `Esc` closes dialogs/overlays
  - improved `aria-label`s
- Security UX:
  - reveal value for 8 seconds
  - auto-lock after inactivity
- Local persistence via localStorage

## Lightweight Tests (Implemented)
- Add secret
- Rename workspace
- Copy value
- Delete selected secret

## Current Gaps / Next Milestones
- No backend sync
- No encryption at rest (client-side only)
- No import/export
- No workspace delete/archive flow
- No e2e test suite yet
