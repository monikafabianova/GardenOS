import { useState } from 'react';
import { api } from '../api';
import type { Sprint } from '../types';

export default function Sprints({
  sprints,
  active,
  reload,
}: {
  sprints: Sprint[];
  active: Sprint | null;
  reload: () => void;
}) {
  const [retro, setRetro] = useState('');
  const closed = sprints.filter((s) => s.status === 'closed');

  const close = async () => {
    if (!active) return;
    await api.closeSprint(active.id, retro);
    setRetro('');
    reload();
  };

  return (
    <div>
      {active && (
        <section className='card'>
          <h2>Close the current sprint</h2>
          <p className='muted'>
            {active.name} ·{' '}
            {active.tasks.filter((t) => t.status === 'done').length} of{' '}
            {active.tasks.length} done. Unfinished tasks return to the backlog.
          </p>
          <div className='form-col'>
            <label>Retro notes</label>
            <textarea
              rows={3}
              value={retro}
              onChange={(e) => setRetro(e.target.value)}
              placeholder='What went well? What ate your evenings?'
            />
            <button className='primary' onClick={close}>
              Close sprint
            </button>
          </div>
        </section>
      )}

      <h2>Past sprints</h2>
      {closed.length === 0 && (
        <p className='muted'>
          Nothing yet. Finish your first sprint and review it here.
        </p>
      )}
      {closed.map((s) => (
        <article className='card' key={s.id}>
          <h3>{s.name}</h3>
          <p className='muted'>
            {s.start_date} to {s.end_date}
            {s.area ? ` · ${s.area}` : ''} ·{' '}
            {s.tasks.filter((t) => t.status === 'done').length}/{s.tasks.length}{' '}
            done
          </p>
          {s.goal && <p>Goal: {s.goal}</p>}
          {s.retro_notes && (
            <p className='retro'>&quot;{s.retro_notes}&quot;</p>
          )}
        </article>
      ))}
    </div>
  );
}
