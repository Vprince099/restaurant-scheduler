# 🍽️ Restaurant Scheduler

A lightweight web app to plan and manage restaurant staff shifts. Designed for fast scheduling by role/station, clear coverage visualization, and easy sharing.

> **Status:** Actively developed. Contributions and feedback welcome!

[![Deploy to Pages](https://github.com/Vprince099/restaurant-scheduler/actions/workflows/deploy.yml/badge.svg)](https://github.com/Vprince099/restaurant-scheduler/actions/workflows/deploy.yml)

**Live site:** https://vprince099.github.io/restaurant-scheduler/

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Scripts](#project-scripts)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Deployment (GitHub Pages)](#deployment-github-pages)
- [Usage Guide](#usage-guide)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [FAQ](#faq)
- [License](#license)

---

## Features
- **Shift planning by role/station** (e.g., FOH, BOH, Expo, Grill, Barista)
- **Day/Week views** with quick scanning of coverage and conflicts
- **Drag-and-drop scheduling** (optional — coming in roadmap)
- **Validation & conflicts**: overlapping shifts, missing breaks, or coverage gaps
- **Templates**: duplicate prior week or apply saved shift presets
- **Notes & tags**: annotate shifts (e.g., *training*, *on-call*, *double*)
- **Export**: print or export to PDF/CSV for posting or staff sharing
- **Mobile-friendly** layout for quick edits on the floor

> If your restaurant uses different terminology (stations/roles), you can customize labels in configuration.

---

## Tech Stack
- **React** + **Vite** (fast dev server & build)
- **JavaScript/TypeScript** (project supports either; choose one and stick to it)
- **CSS** (vanilla or utility framework — see `src/styles`)

> Node.js **18+** (or **20+** recommended)

---

## Quick Start

```bash
# 1) Clone
git clone https://github.com/Vprince099/restaurant-scheduler.git
cd restaurant-scheduler

# 2) Install deps
npm ci   # or: npm install / pnpm i / yarn

# 3) Run dev server
npm run dev
# Vite prints a local URL (e.g., http://localhost:5173)

# 4) Build for production
npm run build

# 5) Preview the production build locally
npm run preview
```

**Windows tip:** If PowerShell blocks scripts, run PowerShell as Administrator and:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Project Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## Project Structure
```text
restaurant-scheduler/
├─ public/                 # static assets
├─ src/
│  ├─ components/          # UI components (ShiftGrid, ShiftCell, etc.)
│  ├─ features/            # scheduling domain logic
│  ├─ pages/               # route-level views
│  ├─ hooks/               # reusable hooks
│  ├─ lib/                 # utilities (dates, validation)
│  ├─ styles/              # global/app styles
│  ├─ App.jsx/tsx          # app shell
│  └─ main.jsx/tsx         # react entry
├─ index.html
├─ package.json
├─ vite.config.js
└─ README.md
```

> Component names like `ScheduleGridByShift` should match actual exports to avoid runtime errors. Keep components small and co-locate unit tests if you add them later.

---

## Configuration
Optional `.env` values (create an `.env` in the project root). Provide safe example values in `.env.example` and **do not** commit secrets.

```bash
# Example (customize as needed)
VITE_APP_NAME="Restaurant Scheduler"
VITE_DEFAULT_VIEW="week"      # "day" | "week"
VITE_OPENING_HOUR=8            # 24h format
VITE_CLOSING_HOUR=22
```

**.gitignore** should include:
```
node_modules/
dist/
*.log
.env
.env.*
```

---

## Deployment (GitHub Pages)

1. **Set Vite base path** so assets resolve under `/restaurant-scheduler/`:
   ```js
   // vite.config.js
   export default {
     base: '/restaurant-scheduler/',
   }
   ```

2. **Add GitHub Actions** workflow at `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [main]
     workflow_dispatch:

   permissions:
     contents: read
     pages: write
     id-token: write

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'npm'
         - run: npm ci
         - run: npm run build
         - uses: actions/upload-pages-artifact@v3
           with:
             path: dist
     deploy:
       needs: build
       runs-on: ubuntu-latest
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - id: deployment
           uses: actions/deploy-pages@v4
   ```

3. In **GitHub → Settings → Pages**, set **Source: GitHub Actions**.

Your app will publish at:
```
https://vprince099.github.io/restaurant-scheduler/
```

---

## Usage Guide
1. **Define roles & stations** (e.g., Grill, Fry, Expo, Host, Server, Bartender)
2. **Add team members** and preferred roles/availability
3. **Create shifts**: choose date, role, start/end times, notes
4. **Review coverage**: highlight gaps or overlaps
5. **Duplicate or template**: copy from previous week to speed up planning
6. **Export** (PDF/CSV) or share a link with staff

> Shortcuts: TBD — common actions will get keyboard shortcuts in a future update.

---

## Roadmap
- [ ] Drag-and-drop shift editing
- [ ] Time-off requests & availability constraints
- [ ] Conflict detection (overtime, double-booking)
- [ ] Role-staff matching score (best-fit suggestions)
- [ ] CSV import/export for staff & templates
- [ ] Printable weekly schedule view
- [ ] Dark mode & accessibility pass

Have an idea? Open an issue!

---

## Contributing
1. Fork the repo and create a feature branch:
   ```bash
   git switch -c feature/your-feature
   ```
2. Commit with clear messages (Conventional Commits encouraged):
   ```
   feat: add week view summary
   fix: correct overlap validation
   chore: update deps
   ```
3. Push and open a Pull Request against `main`.

Please run the formatter/linter if configured before pushing.

---

## FAQ
**Why Vite?** Fast HMR and simple production builds.

**Does it need a backend?** Not for basic scheduling demos. A backend (API) can be added for auth, multi-user sync, and long-term storage.

**Will this work offline?** Consider adding a PWA in the roadmap.

---

## License
MIT — see `LICENSE` file (or choose a different license to fit your needs).

