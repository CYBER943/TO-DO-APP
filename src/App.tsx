/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Task, 
  Project, 
  Tag, 
  Section, 
  ViewType, 
  AppState 
} from './types';
import { loadState, saveState } from './lib/storage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import TaskView from './components/TaskView';
import TaskDialog from './components/TaskDialog';
import AnalyticsView from './components/AnalyticsView';
import CalendarView from './components/CalendarView';
import LandingPage from './components/LandingPage';
import { Toaster, toast } from 'sonner';
import { suggestPrioritization } from './lib/gemini';
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot, 
  User as FirebaseUser,
  handleFirestoreError,
  OperationType
} from './lib/firebase';

export default function App() {
  const [state, setState] = useState<AppState>(loadState());
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  // Handle Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
      
      if (firebaseUser) {
        setShowLanding(false);
        // Sync user profile to Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(), // This will be overwritten if exists
          }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
        }
      } else {
        setShowLanding(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync Data from Firestore
  useEffect(() => {
    if (!user) return;

    const tasksRef = collection(db, 'users', user.uid, 'tasks');
    const projectsRef = collection(db, 'users', user.uid, 'projects');
    const tagsRef = collection(db, 'users', user.uid, 'tags');

    const unsubTasks = onSnapshot(tasksRef, (snapshot) => {
      const tasks = snapshot.docs.map(doc => doc.data() as Task);
      setState(prev => ({ ...prev, tasks }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/tasks`));

    const unsubProjects = onSnapshot(projectsRef, async (snapshot) => {
      const projects = snapshot.docs.map(doc => doc.data() as Project);
      if (projects.length > 0) {
        setState(prev => ({ ...prev, projects }));
      } else {
        // Seed default projects
        const defaults = [
          { id: 'inbox', name: 'Inbox', color: '#3b82f6', icon: 'Inbox', uid: user.uid },
          { id: 'personal', name: 'Personal', color: '#10b981', icon: 'User', uid: user.uid },
          { id: 'work', name: 'Work', color: '#f59e0b', icon: 'Briefcase', uid: user.uid },
        ];
        for (const p of defaults) {
          await setDoc(doc(db, 'users', user.uid, 'projects', p.id), p);
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/projects`));

    const unsubTags = onSnapshot(tagsRef, async (snapshot) => {
      const tags = snapshot.docs.map(doc => doc.data() as Tag);
      if (tags.length > 0) {
        setState(prev => ({ ...prev, tags }));
      } else {
        // Seed default tags
        const defaults = [
          { id: 'urgent', name: 'Urgent', color: '#ef4444', uid: user.uid },
          { id: 'study', name: 'Study', color: '#8b5cf6', uid: user.uid },
          { id: 'coding', name: 'Coding', color: '#3b82f6', uid: user.uid },
        ];
        for (const t of defaults) {
          await setDoc(doc(db, 'users', user.uid, 'tags', t.id), t);
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/tags`));

    return () => {
      unsubTasks();
      unsubProjects();
      unsubTags();
    };
  }, [user]);

  const handleStart = () => {
    setShowLanding(false);
  };

  // Save state whenever it changes
  useEffect(() => {
    saveState(state);
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state]);

  const filteredTasks = useMemo(() => {
    let tasks = state.tasks;

    // View/Project filter
    if (state.activeProjectId === 'inbox') {
      tasks = tasks.filter(t => t.projectId === 'inbox');
    } else if (state.activeProjectId === 'today') {
      const today = new Date().toISOString().split('T')[0];
      tasks = tasks.filter(t => t.dueDate?.startsWith(today));
    } else if (state.activeProjectId === 'upcoming') {
      const today = new Date().toISOString().split('T')[0];
      tasks = tasks.filter(t => t.dueDate && t.dueDate > today);
    } else if (state.activeProjectId !== 'all') {
      tasks = tasks.filter(t => t.projectId === state.activeProjectId);
    }

    // Search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      tasks = tasks.filter(t => 
        t.title.toLowerCase().includes(query) || 
        t.description?.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Priority filter
    if (state.filters.priority.length > 0) {
      tasks = tasks.filter(t => state.filters.priority.includes(t.priority));
    }

    // Tags filter
    if (state.filters.tags.length > 0) {
      tasks = tasks.filter(t => t.tags.some(tag => state.filters.tags.includes(tag)));
    }

    // Completion filter
    if (state.filters.completed === 'completed') {
      tasks = tasks.filter(t => t.completed);
    } else if (state.filters.completed === 'active') {
      tasks = tasks.filter(t => !t.completed);
    }

    return tasks;
  }, [state.tasks, state.searchQuery, state.activeProjectId, state.filters]);

  const handleAddTask = () => {
    setEditingTask(undefined);
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (!user) return;

    if (editingTask) {
      // Update existing task
      const taskRef = doc(db, 'users', user.uid, 'tasks', editingTask.id);
      try {
        await setDoc(taskRef, { 
          ...editingTask, 
          ...taskData, 
          updatedAt: new Date().toISOString() 
        }, { merge: true });
        toast.success('Task updated');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/tasks/${editingTask.id}`);
      }
    } else {
      // Create new task
      const id = Math.random().toString(36).substr(2, 9);
      const newTask: Task = {
        id,
        title: taskData.title || '',
        description: taskData.description,
        dueDate: taskData.dueDate,
        priority: taskData.priority || 'medium',
        tags: taskData.tags || [],
        projectId: taskData.projectId || state.activeProjectId,
        completed: false,
        subtasks: taskData.subtasks || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: [],
        uid: user.uid,
        order: state.tasks.length,
      };
      
      try {
        await setDoc(doc(db, 'users', user.uid, 'tasks', id), newTask);
        toast.success('Task added');
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/tasks/${id}`);
      }
    }
  };

  const handleToggleComplete = async (id: string) => {
    if (!user) return;
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    const taskRef = doc(db, 'users', user.uid, 'tasks', id);
    try {
      await setDoc(taskRef, { 
        completed: !task.completed, 
        updatedAt: new Date().toISOString() 
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/tasks/${id}`);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!user) return;
    const taskRef = doc(db, 'users', user.uid, 'tasks', id);
    try {
      await setDoc(taskRef, { deleted: true }, { merge: true }); // Or deleteDoc(taskRef)
      // For now let's just delete it
      const { deleteDoc } = await import('./lib/firebase');
      await deleteDoc(taskRef);
      toast.error('Task deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/tasks/${id}`);
    }
  };

  const handleReorder = async (taskId: string, newSectionId: string, newOrder: number) => {
    if (!user) return;
    const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
    try {
      await setDoc(taskRef, { 
        sectionId: newSectionId, 
        order: newOrder,
        updatedAt: new Date().toISOString() 
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/tasks/${taskId}`);
    }
  };

  const handleAiPrioritize = async () => {
    const incompleteTasks = state.tasks.filter(t => !t.completed);
    if (incompleteTasks.length === 0) {
      toast.info('No tasks to prioritize');
      return;
    }

    toast.promise(suggestPrioritization(incompleteTasks), {
      loading: 'ZenAI is analyzing your tasks...',
      success: (suggestions) => {
        if (suggestions.length === 0) return 'No suggestions found';
        
        // Highlight suggested tasks or show in a special way
        // For now, we'll just show a toast with the top suggestion
        const topSuggestion = suggestions[0];
        const task = state.tasks.find(t => t.id === topSuggestion.taskId);
        return `Priority: ${task?.title}. Reason: ${topSuggestion.reason}`;
      },
      error: 'Failed to get AI suggestions',
    });
  };

  if (!isAuthReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showLanding) {
    return <LandingPage onStart={handleStart} />;
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar
        projects={state.projects}
        tags={state.tags}
        activeProjectId={state.activeProjectId}
        activeView={state.view}
        onProjectSelect={(id) => setState({ ...state, activeProjectId: id })}
        onViewSelect={(view) => setState({ ...state, view })}
        onAddProject={() => toast.info('Add project feature coming soon')}
        user={user}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          searchQuery={state.searchQuery}
          onSearchChange={(query) => setState({ ...state, searchQuery: query })}
          onAddTask={handleAddTask}
          onToggleTheme={() => setState({ ...state, theme: state.theme === 'dark' ? 'light' : 'dark' })}
          theme={state.theme}
          onAiSuggest={handleAiPrioritize}
        />

        <main className="flex-1 overflow-hidden relative">
          {state.view === 'list' || state.view === 'board' ? (
            <TaskView
              tasks={filteredTasks}
              view={state.view}
              activeProjectId={state.activeProjectId}
              projects={state.projects}
              sections={state.sections}
              tags={state.tags}
              filters={state.filters}
              onFilterChange={(filters) => setState({ ...state, filters })}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onAddTask={handleAddTask}
              onReorder={handleReorder}
            />
          ) : state.view === 'calendar' ? (
            <CalendarView 
              tasks={filteredTasks} 
              onEditTask={handleEditTask}
              onAddTask={handleAddTask}
            />
          ) : (
            <AnalyticsView tasks={state.tasks} />
          )}
        </main>
      </div>

      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onSave={handleSaveTask}
        task={editingTask}
        projects={state.projects}
        tags={state.tags}
        initialProjectId={state.activeProjectId}
      />

      <Toaster position="bottom-right" />
    </div>
  );
}

