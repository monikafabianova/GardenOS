import { useState } from 'react';
import { api } from '../api';

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function NewSprint({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [area, setArea] = useState('');
  const [start, setStart] = useState(fmt(new Date()));
  const [end, setEnd] = useState(fmt(new Date(Date.now() + 14 * 86_400_000)));

  const create = async () => {
    if (!name.trim()) return;
    await api.createSprint({
      name,
      goal,
      area,
      start_date: start,
      end_date: end,
    });
    onCreated();
  };

  return (
    <section className='card'>
      <h2>Start your first sprint</h2>
      <form
        className='grid-form'
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
      >
        <label>
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. Two weeks of momentum'
          />
        </label>
        <label>
          Area
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder='dev, course, health, home'
          />
        </label>
        <label>
          Goal
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder='what does finishing look like'
          />
        </label>
        <label>
          Start
          <input
            type='date'
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
          />
        </label>
        <label>
          End
          <input
            type='date'
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
          />
        </label>
        <button className='primary' type='submit'>
          Start sprint
        </button>
      </form>
    </section>
  );
}
