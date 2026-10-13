import type { BoardData, Task, TaskStatus } from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  getBoard: () => request<BoardData>('/api/sprints'),
  createSprint: (body: {
    name: string;
    goal?: string;
    area?: string;
    start_date: string;
    end_date: string;
  }) =>
    request<BoardData>('/api/sprints', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  closeSprint: (id: number, retroNotes: string) =>
    request<BoardData>(`/api/sprints/${id}/close`, {
      method: 'POST',
      body: JSON.stringify({ retro_notes: retroNotes }),
    }),
  createTask: (title: string, sprintId: number | null) =>
    request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, sprint_id: sprintId }),
    }),
  updateTask: (
    id: number,
    patch: { title?: string; status?: TaskStatus; sprint_id?: number | null },
  ) =>
    request<Task>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  deleteTask: (id: number) =>
    request<void>(`/api/tasks/${id}`, { method: 'DELETE' }),
};
