import React from 'react';
import { Task, ViewType, Project, Section } from '../types';
import TaskItem from './TaskItem';
import { ScrollArea } from '../../components/ui/scroll-area';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

interface TaskViewProps {
  tasks: Task[];
  view: ViewType;
  activeProjectId: string;
  projects: Project[];
  sections: Section[];
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onAddTask: () => void;
}

const TaskView: React.FC<TaskViewProps> = ({
  tasks,
  view,
  activeProjectId,
  projects,
  sections,
  onToggleComplete,
  onEdit,
  onDelete,
  onAddTask,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeProject = projects.find(p => p.id === activeProjectId);
  const projectTasks = tasks.filter(t => {
    if (activeProjectId === 'inbox') return t.projectId === 'inbox';
    if (activeProjectId === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return t.dueDate?.startsWith(today);
    }
    if (activeProjectId === 'upcoming') {
      const today = new Date().toISOString().split('T')[0];
      return t.dueDate && t.dueDate > today;
    }
    return t.projectId === activeProjectId;
  });

  const renderListView = () => (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {activeProjectId === 'inbox' ? 'Inbox' : 
             activeProjectId === 'today' ? 'Today' : 
             activeProjectId === 'upcoming' ? 'Upcoming' : 
             activeProject?.name}
          </h2>
          <p className="text-muted-foreground mt-1">
            {projectTasks.length} tasks • {projectTasks.filter(t => t.completed).length} completed
          </p>
        </div>
        <Button onClick={onAddTask} size="sm" className="rounded-full px-4">
          <Plus className="w-4 h-4 mr-2" /> Add Task
        </Button>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {projectTasks.length > 0 ? (
            projectTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Plus className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium">No tasks found</p>
                <p className="text-sm text-muted-foreground">Get started by adding your first task.</p>
              </div>
              <Button variant="outline" onClick={onAddTask}>Add Task</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  const renderBoardView = () => {
    const projectSections = sections.filter(s => s.projectId === activeProjectId);
    const defaultSections = [
      { id: 'todo', name: 'To Do' },
      { id: 'inprogress', name: 'In Progress' },
      { id: 'completed', name: 'Completed' }
    ];
    const displaySections = projectSections.length > 0 ? projectSections : defaultSections;

    return (
      <div className="h-full flex gap-6 p-6 overflow-x-auto">
        {displaySections.map(section => {
          const sectionTasks = projectTasks.filter(t => 
            section.id === 'completed' ? t.completed : (t.sectionId === section.id || (!t.sectionId && section.id === 'todo'))
          );

          return (
            <div key={section.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{section.name}</h3>
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    {sectionTasks.length}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-3 pb-4">
                  {sectionTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={onToggleComplete}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground border border-dashed border-transparent hover:border-muted-foreground/20"
                    onClick={onAddTask}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Task</span>
                  </Button>
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full overflow-hidden bg-background/50">
      {view === 'list' && renderListView()}
      {view === 'board' && renderBoardView()}
      {view === 'calendar' && (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          Calendar view coming soon...
        </div>
      )}
      {view === 'analytics' && (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          Analytics view coming soon...
        </div>
      )}
    </div>
  );
};

export default TaskView;
