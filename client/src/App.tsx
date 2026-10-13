import { useEffect, useState } from 'react';
import { api } from './api';
import type { BoardData } from './types';
import Board from './components/Board';
import NewSprint from './components/NewSprint';
import Sprints from './components/Sprints';

export default function App() {
  const [data, setData] = useState<BoardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'board' | 'sprints'>('board');

  const reload = () => {
    setError(null);
    api
      .getBoard()
      .then(setData)
      .catch((e) => setError(String(e)));
  };
  useEffect(reload, []);

  const active = data?.sprints.find((s) => s.status === 'active') ?? null;

  return (
    <div className='app'>
      <header className='topbar'>
        <h1>GardenOS</h1>
        <nav>
          <button
            className={view === 'board' ? 'active' : ''}
            onClick={() => setView('board')}
          >
            Board
          </button>
          <button
            className={view === 'sprints' ? 'active' : ''}
            onClick={() => setView('sprints')}
          >
            Sprints
          </button>
        </nav>
      </header>

      {error && <p className='error'>Something went wrong: {error}</p>}

      {data === null ? (
        <p className='muted'>Loading...</p>
      ) : view === 'board' ? (
        active ? (
          <Board active={active} backlog={data.backlog} reload={reload} />
        ) : (
          <NewSprint onCreated={reload} />
        )
      ) : (
        <Sprints sprints={data.sprints} active={active} reload={reload} />
      )}
    </div>
  );
}
