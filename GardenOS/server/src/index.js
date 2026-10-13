const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json());

const TASK_STATUSES = ['todo', 'doing', 'done'];

function getBoard() {
  const sprints = db.prepare('SELECT * FROM sprints ORDER BY id DESC').all();
  const tasks = db.prepare('SELECT * FROM tasks').all();
  const bySprint = new Map();
  const backlog = [];
  for (const t of tasks) {
    if (t.sprint_id == null) {
      backlog.push(t);
      continue;
    }
    if (!bySprint.has(t.sprint_id)) bySprint.set(t.sprint_id, []);
    bySprint.get(t.sprint_id).push(t);
  }
  return {
    sprints: sprints.map((s) => ({ ...s, tasks: bySprint.get(s.id) ?? [] })),
    backlog,
  };
}

// map thrown errors to JSON 500s instead of HTML
const h = (fn) => (req, res) => {
  try {
    fn(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};

app.get(
  '/api/sprints',
  h((req, res) => res.json(getBoard())),
);

app.post(
  '/api/sprints',
  h((req, res) => {
    const {
      name,
      goal,
      area,
      start_date: start,
      end_date: end,
    } = req.body ?? {};
    if (!name?.trim())
      return res.status(400).json({ error: 'name is required' });
    if (!start || !end)
      return res
        .status(400)
        .json({ error: 'start and end dates are required' });

    // a new sprint closes the current one; unfinished tasks return to the backlog
    db.transaction(() => {
      for (const s of db
        .prepare("SELECT id FROM sprints WHERE status = 'active'")
        .all()) {
        db.prepare(
          "UPDATE tasks SET sprint_id = NULL WHERE sprint_id = ? AND status != 'done'",
        ).run(s.id);
        db.prepare("UPDATE sprints SET status = 'closed' WHERE id = ?").run(
          s.id,
        );
      }
      db.prepare(
        'INSERT INTO sprints (name, goal, area, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
      ).run(
        name.trim(),
        goal?.trim() || null,
        area?.trim() || null,
        start,
        end,
      );
    })();
    res.status(201).json(getBoard());
  }),
);

app.post(
  '/api/sprints/:id/close',
  h((req, res) => {
    const id = Number(req.params.id);
    const sprint = db.prepare('SELECT * FROM sprints WHERE id = ?').get(id);
    if (!sprint) return res.status(404).json({ error: 'sprint not found' });
    const { retro_notes } = req.body ?? {};
    db.transaction(() => {
      db.prepare(
        "UPDATE tasks SET sprint_id = NULL WHERE sprint_id = ? AND status != 'done'",
      ).run(id);
      db.prepare(
        'UPDATE sprints SET status = ?, retro_notes = ? WHERE id = ?',
      ).run('closed', retro_notes?.trim() || null, id);
    })();
    res.json(getBoard());
  }),
);

app.post(
  '/api/tasks',
  h((req, res) => {
    const { title, sprint_id } = req.body ?? {};
    if (!title?.trim())
      return res.status(400).json({ error: 'title is required' });
    if (
      sprint_id != null &&
      !db.prepare('SELECT id FROM sprints WHERE id = ?').get(sprint_id)
    ) {
      return res.status(400).json({ error: 'sprint not found' });
    }
    const id = db
      .prepare('INSERT INTO tasks (title, sprint_id) VALUES (?, ?)')
      .run(title.trim(), sprint_id ?? null).lastInsertRowid;
    res
      .status(201)
      .json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id));
  }),
);

app.patch(
  '/api/tasks/:id',
  h((req, res) => {
    const id = Number(req.params.id);
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) return res.status(404).json({ error: 'task not found' });
    const { title, status, sprint_id } = req.body ?? {};
    if (status !== undefined && !TASK_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ error: `status must be one of ${TASK_STATUSES.join(', ')}` });
    }
    const cols = [];
    const vals = [];
    if (title !== undefined) {
      cols.push('title');
      vals.push(String(title).trim() || task.title);
    }
    if (status !== undefined) {
      cols.push('status');
      vals.push(status);
    }
    if (sprint_id !== undefined) {
      cols.push('sprint_id');
      vals.push(sprint_id);
    }
    if (!cols.length)
      return res.status(400).json({ error: 'nothing to update' });
    db.prepare(
      `UPDATE tasks SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
    ).run(...vals, id);
    res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id));
  }),
);

app.delete(
  '/api/tasks/:id',
  h((req, res) => {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(Number(req.params.id));
    res.status(204).end();
  }),
);

const PORT = process.env.PORT || 3005;
app.listen(PORT, () =>
  console.log(`GardenOS API listening on http://localhost:${PORT}`),
);
