import { AppState, Task, Project, Section, Tag } from '../types';

const STORAGE_KEY = 'zentask_state';

const defaultState: AppState = {
  tasks: [],
  projects: [
    { id: 'inbox', name: 'Inbox', color: '#3b82f6', icon: 'Inbox' },
    { id: 'personal', name: 'Personal', color: '#10b981', icon: 'User' },
    { id: 'work', name: 'Work', color: '#f59e0b', icon: 'Briefcase' },
  ],
  sections: [
    { id: 'todo', projectId: 'work', name: 'To Do', order: 0 },
    { id: 'inprogress', projectId: 'work', name: 'In Progress', order: 1 },
    { id: 'completed', projectId: 'work', name: 'Completed', order: 2 },
  ],
  tags: [
    { id: 'urgent', name: 'Urgent', color: '#ef4444' },
    { id: 'study', name: 'Study', color: '#8b5cf6' },
    { id: 'coding', name: 'Coding', color: '#3b82f6' },
  ],
  activeProjectId: 'inbox',
  view: 'list',
  searchQuery: '',
  theme: 'dark',
};

export const loadState = (): AppState => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return defaultState;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return defaultState;
  }
};

export const saveState = (state: AppState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (err) {
    // Ignore write errors
  }
};
