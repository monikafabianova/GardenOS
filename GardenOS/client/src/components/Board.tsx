import { useState } from 'react';
import { api } from '../api';
import type { Sprint, Task } from '../types';

const DAY_MS = 86_400_000;

const COLUMNS: { key: Task['status']; label: string }[] = [
  { key: 'todo', label: 'To do' },
  { key: 'doing', label: 'Doing' },
  { key: 'done', label: 'Done' },
];

export default function Board({
  active,
  backlog,
  reload,
}: {
  active: Sprint;
  backlog: Task[];
  reload: () => void;
}) {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState<'sprint' | 'backlog'>('sprint');

  const done = active.tasks.filter((t) => t.status === 'done').length;
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(active.end_date).getTime() - Date.now()) / DAY_MS),
  );

  const addTask = async () => {
    if (!title.trim()) return;
    await api.createTask(title, target === 'sprint' ? active.id : null);
    setTitle('');
    reload();
  };

  // moving a task into a column commits it to the active sprint
  const move = (task: Task, status: Task['status']) => {
    void api.updateTask(task.id, { status, sprint_id: active.id }).then(reload);
  };

  const actions = (
    task: Task,
  ): { label: string; onClick: () => void; danger?: boolean }[] => {
    if (task.status === 'todo')
      return [{ label: 'Start', onClick: () => move(task, 'doing') }];
    if (task.status === 'doing')
      return [
        { label: 'Back to to do', onClick: () => move(task, 'todo') },
        { label: 'Finish', onClick: () => move(task, 'done') },
      ];
    return [
      {
        label: 'Delete',
        onClick: () => void api.deleteTask(task.id).then(reload),
        danger: true,
      },
    ];
  };

  return (
    <div>
      <section className='card sprint-header'>
        <div>
          <h2>{active.name}</h2>
          <p className='muted'>
            {active.goal && <span>{active.goal} · </span>}
            {active.area && <span>{active.area} · </span>}
            {active.start_date} to {active.end_date} · {daysLeft} days left
          </p>
        </div>
        <p className='progress'>
          {done} / {active.tasks.length} done
        </p>
      </section>

      <div className='board'>
        {COLUMNS.map((col) => {
          const tasks = active.tasks.filter((t) => t.status === col.key);
          return (
            <section className='column' key={col.key}>
              <h3>{col.label}</h3>
              {tasks.length === 0 && (
                <p className='muted empty'>Nothing here</p>
              )}
              {tasks.map((task) => (
                <div className='task' key={task.id}>
                  <span>{task.title}</span>
                  <span className='task-actions'>
                    {actions(task).map((a) => (
                      <button
                        key={a.label}
                        className={a.danger ? 'danger' : ''}
                        onClick={a.onClick}
                      >
                        {a.label}
                      </button>
                    ))}
                  </span>
                </div>
              ))}
            </section>
          );
        })}
      </div>

      <section className='card'>
        <h2>Add a task</h2>
        <form
          className='form-row'
          onSubmit={(e) => {
            e.preventDefault();
            void addTask();
          }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='e.g. finish the 3D vault explorer'
            required
          />
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as 'sprint' | 'backlog')}
          >
            <option value='sprint'>This sprint</option>
            <option value='backlog'>Backlog (next sprints)</option>
          </select>
          <button className='primary' type='submit'>
            Add
          </button>
        </form>
      </section>

      <section className='card'>
        <h2>Backlog</h2>
        {backlog.length === 0 && (
          <p className='muted'>
            Empty. Unfinished tasks land here when a sprint closes.
          </p>
        )}
        {backlog.map((task) => (
          <div className='task' key={task.id}>
            <span>{task.title}</span>
            <button onClick={() => move(task, 'todo')}>Add to sprint</button>
          </div>
        ))}
      </section>
    </div>
  );
}
