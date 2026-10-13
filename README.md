# GardenOS

A personal sprint planner - scrum for your own life. Two-week sprints over courses, health and side-projects, with reviews and retrospectives.

## Stack

- `client/` - React 19 + TypeScript + Vite
- `server/` - Node.js + Express + better-sqlite3 (single-file DB, no setup)

## Run

Terminal 1:

```
cd server && npm install && npm start     # API on http://localhost:3005
```

Terminal 2:

```
cd client && npm install && npm run dev   # app on http://localhost:5174
```

Set `PORT` to override the API port. The client proxies `/api` to the server - no CORS config needed.

## API

| Method | Path                     | Body                                           | Description                           |
| ------ | ------------------------ | ---------------------------------------------- | ------------------------------------- |
| GET    | `/api/sprints`           | -                                              | Board data: `{ sprints, backlog }`    |
| POST   | `/api/sprints`           | `{ name, goal?, area?, start_date, end_date }` | Create sprint (closes any active one) |
| POST   | `/api/sprints/:id/close` | `{ retro_notes? }`                             | Close sprint + retro notes            |
| POST   | `/api/tasks`             | `{ title, sprint_id? }`                        | Add task (`sprint_id` null = backlog) |
| PATCH  | `/api/tasks/:id`         | `{ status?, title?, sprint_id? }`              | Update task                           |
| DELETE | `/api/tasks/:id`         | -                                              | Delete task                           |

## Rules

- Closing a sprint returns unfinished tasks to the backlog; finished work stays with the sprint.
- Creating a sprint while another is active auto-closes the active one.

## Tests

With the server running: `node test-api.mjs`

## Roadmap

- Burndown + velocity charts
- Money sprints (budget + expense log per sprint)
- Recurring chores
- Retro templates
- PWA / auth / sync
