export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface List {
  id: string;
  name: string;
  icon: string; // Emoji
  color: string; // Tailwind color class or hex
  tasks: Task[];
  notes: Note[];
  createdAt: number;
}

export interface AppData {
  lists: List[];
}

export enum ViewMode {
  TASKS = 'TASKS',
  NOTES = 'NOTES',
  BOTH = 'BOTH'
}