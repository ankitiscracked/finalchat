# finalchat

finalchat is a keyboard-first planning app. Everything you type drops into a running timeline, and quick slash commands let you spin up tasks, meetings, or notes without leaving the text box. The app runs fully in the browser and keeps your information on your machine.

## What you can do here

- Keep a dated feed of every task, event, and note you add.
- Create new items with slash commands like `/task finish report` or `/event coffee chat Friday 3pm`.
- Write free-form notes; they are saved the moment you hit `Cmd + Enter` (or click **Send**).
- Open focused views for your week, your backlog, or a project-specific list.
- Pull up an experimental canvas to arrange clusters of work visually.

## Layout at a glance

- **Timeline (center column):** Shows everything you have captured, grouped by day. Icons help you spot tasks vs notes at a glance.
- **Command bar (bottom):** The text area listens for keyboard shortcuts, autosuggests commands, and shows inline autocomplete when you tap `Tab`.
- **Overview panel (right side):** Appears when you use commands such as `/show tasks`, `/week-tasks`, or `/ai-overview tasks`. You can flip between the standard list and a mock “AI” summary.
- **Canvas view:** Toggle it with `/canvas` to explore a drag-free, keyboard-driven workspace of clusters. Use `/close-canvas` to tuck it away.
- **Commands drawer:** Press `/` and wait for hints, or use the button in the layout to browse everything the command system knows.

## Working with items

- **Tasks:** `/task pick up dry cleaning`. Tasks default to “to do” and land in the timeline. Use project tags (type `#` while writing) to assign a task to a project.
- **Events:** `/event call Sam on Tuesday at 10`. Events support optional project or collection tags, similar to tasks.
- **Notes:** Just type plain text and submit. Notes are the default when no slash command is present.
- **Bulk actions:** Select items in the overview, then run commands like `/delete` or `/move-to inbox`. The action runs on whatever is highlighted.

### Handy commands and shortcuts

- `Cmd + Enter` / `Ctrl + Enter`: submit the current input.
- `Tab`: accept the suggested completion.
- `/show tasks`, `/show notes`, `/show events`: open the overview for that item type.
- `/week-tasks` and `/close-week-tasks`: jump into or out of the current weekly plan.
- `/close-overview`: hide the side panel.
- `/canvas` and `/close-canvas`: show or hide the canvas workspace.
- `/ai-overview tasks`: generate a demo summary (simulated on the client for now).

## Data and storage

- Everything lives in your browser using IndexedDB through Dexie. Nothing is sent to a server.
- Clearing your browser storage wipes the data, so export or copy anything important before doing that.

## Built-in manual

- There is a friendlier walkthrough at `content/manual.md`, surfaced in the app at `/manual`.
- The `/about` page shares the motivation behind the project.

## Getting started

1. Install dependencies with your preferred package manager (npm, pnpm, yarn, or bun):
   ```bash
   npm install
   ```
2. Start the dev server at `http://localhost:3000`:
   ```bash
   npm run dev
   ```
3. Build for production when you are ready to ship:
   ```bash
   npm run build
   npm run preview
   ```
   Nuxt 3 powers the app, Tailwind supplies utility styles, and @nuxt/ui provides the base components.

## Project map

- `src/pages/`: main routes such as the home timeline, manual, and about page.
- `src/components/`: chat timeline pieces, overview widgets, canvas UI, and supporting drawers.
- `src/composables/`: Vue composables that wrap tasks, events, notes, projects, keyboard commands, suggestions, and shared state.
- `src/services/`: data helpers, including the Dexie-powered local database.
- `src/styles/`: shared colors and global styles.
- `content/`: Markdown content served through `@nuxt/content`.
- `public/`: static assets.

## Development notes

- The app runs client-side only (`ssr: false` in `nuxt.config.ts`).
- Tailwind v4 is wired in through the Vite plugin.
- Typescript is enabled across the project, and XState manages the command input state machine.
