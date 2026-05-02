# Setup and Run

## Requirements
- Node.js >= 20
- npm >= 10

## Install
```bash
cd /Users/manuel/Developer/apikey-app
npm install
```

## Development
```bash
npm run dev
```
Default URL: `http://localhost:5173`

## LAN / iPhone Testing
```bash
npm run dev -- --host 0.0.0.0 --port 5175
```
Open on phone: `http://<your-laptop-ip>:5175`

## Tests
```bash
npm run test:run
```

## Production Build
```bash
npm run build
```
Output: `dist/`

## GitHub Pages Build (local preview target)
```bash
npm run build:pages
```

## Common Issues
### Blank page after changes
1. Stop old dev server
2. Start again with `npm run dev`
3. Hard reload browser (`Cmd+Shift+R`)

### Port conflict
```bash
npm run dev -- --port 5174
```
