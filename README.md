# Theodore Personal Blog

A Next.js migration of the Theodore personal dashboard and blog prototype.

## Development

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```powershell
npm run lint
npm run build
```

## Design workflow

`prototype/` contains the Agent-generated HTML/CSS design source. Production code lives in `src/`. Review prototype updates with Git and selectively synchronize approved changes into reusable Next.js components.

See `AGENTS.md` for the project structure, design system rules, component conventions, and synchronization workflow.
