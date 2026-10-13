export type TaskStatus = 'todo' | 'doing' | 'done';

export type Task = {
  id: number;
  title: string;
  status: TaskStatus;
  sprint_id: number | null;
};

export type Sprint = {
  id: number;
  name: string;
  goal: string | null;
  area: string | null;
  start_date: string;
  end_date: string;
  retro_notes: string | null;
  status: 'active' | 'closed';
  tasks: Task[];
};

export type BoardData = {
  sprints: Sprint[];
  backlog: Task[];
};
