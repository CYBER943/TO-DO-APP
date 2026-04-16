export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: Priority;
  tags: string[];
  projectId: string;
  sectionId?: string;
  completed: boolean;
  subtasks: SubTask[];
  createdAt: string;
  updatedAt: string;
  attachments: string[]; // URLs or links
  uid: string;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon?: string;
  uid?: string;
}

export interface Section {
  id: string;
  projectId: string;
  name: string;
  order: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  uid?: string;
}

export type ViewType = 'list' | 'board' | 'calendar' | 'analytics';

export interface TaskFilters {
  priority: Priority[];
  tags: string[];
  completed: 'all' | 'completed' | 'active';
}

export interface AppState {
  tasks: Task[];
  projects: Project[];
  sections: Section[];
  tags: Tag[];
  activeProjectId: string; // 'inbox' or project id
  view: ViewType;
  searchQuery: string;
  theme: 'light' | 'dark';
  filters: TaskFilters;
}
