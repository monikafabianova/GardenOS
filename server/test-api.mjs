// Smoke test for the GardenOS API. Run with the server up:  node test-api.mjs
const BASE = process.env.BASE ?? 'http://localhost:3005/api';
const j = (r) => r.json();
const post = (path, body) =>
  fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
const patch = (path, body) =>
  fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

let failed = 0;
const check = (name, cond) => {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}`);
  if (!cond) failed++;
};

const empty = await fetch(`${BASE}/sprints`).then(j);
check(
  'board starts empty',
  empty.sprints.length === 0 && empty.backlog.length === 0,
);

const created = await post('/sprints', {
  name: 'Test sprint',
  goal: 'ship v1',
  area: 'dev',
  start_date: '2026-01-05',
  end_date: '2026-01-19',
}).then(j);
const sid = created.sprints[0]?.id ?? 0;
check(
  'sprint created as active',
  created.sprints.length === 1 &&
    created.sprints[0].status === 'active' &&
    created.sprints[0].goal === 'ship v1',
);

const t1 = await post('/tasks', { title: 'will finish', sprint_id: sid }).then(
  j,
);
const t2 = await post('/tasks', { title: 'will requeue' }).then(j);
check(
  'tasks created (one in sprint, one in backlog)',
  t1.sprint_id === sid && t2.sprint_id === null,
);

await patch(`/tasks/${t1.id}`, { status: 'done' });
const bad = await patch(`/tasks/${t2.id}`, { status: 'nope' });
check('rejects invalid status', bad.status === 400);

const closed = await post(`/sprints/${sid}/close`, {
  retro_notes: 'shipped it',
}).then(j);
const cs = closed.sprints.find((s) => s.id === sid);
check(
  'sprint closed with retro notes',
  cs?.status === 'closed' && cs?.retro_notes === 'shipped it',
);
check(
  'done task stays with sprint, undone returns to backlog',
  cs?.tasks.some((t) => t.title === 'will finish') === true &&
    closed.backlog.some((t) => t.title === 'will requeue') === true,
);

const sprint2 = await post('/sprints', {
  name: 'Sprint two',
  start_date: '2026-02-02',
  end_date: '2026-02-16',
}).then(j);
check(
  'new sprint auto-closes the previous one',
  sprint2.sprints.find((s) => s.id === sid)?.status === 'closed' &&
    sprint2.sprints.find((s) => s.id !== sid)?.status === 'active',
);

await fetch(`${BASE}/tasks/${t2.id}`, { method: 'DELETE' });
const after = await fetch(`${BASE}/sprints`).then(j);
check(
  'deleting a task removes it from the backlog',
  after.backlog.length === 0,
);

console.log(failed ? `${failed} check(s) FAILED` : 'all checks passed');
process.exit(failed ? 1 : 0);
