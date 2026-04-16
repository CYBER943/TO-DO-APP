import React from 'react';
import { Task, ViewType, Project, Section, Tag, TaskFilters, Priority } from '../types';
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
import { Plus, MoreHorizontal, Filter, Check, X, Tag as TagIcon, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Separator } from '../../components/ui/separator';
import { cn } from '../../lib/utils';

interface TaskViewProps {
  tasks: Task[];
  view: ViewType;
  activeProjectId: string;
  projects: Project[];
  sections: Section[];
  tags: Tag[];
  filters: TaskFilters;
  onFilterChange: (filters: TaskFilters) => void;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onAddTask: () => void;
  onReorder: (taskId: string, newSectionId: string, newOrder: number) => void;
}

const TaskView: React.FC<TaskViewProps> = ({
  tasks,
  view,
  activeProjectId,
  projects,
  sections,
  tags,
  filters,
  onFilterChange,
  onToggleComplete,
  onEdit,
  onDelete,
  onAddTask,
  onReorder,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeProject = projects.find(p => p.id === activeProjectId);
  
  // Sort tasks by order
  const projectTasks = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Find the task being dragged
    const draggedTask = projectTasks.find(t => t.id === activeId);
    if (!draggedTask) return;

    // Check if we dropped over a task or a section
    const overTask = projectTasks.find(t => t.id === overId);
    
    let newSectionId = draggedTask.sectionId || 'todo';
    let newOrder = draggedTask.order || 0;

    if (overTask) {
      newSectionId = overTask.sectionId || 'todo';
      newOrder = overTask.order;
      // If moving within the same section, we might need to adjust orders of other tasks
      // For simplicity, we'll just set it to overTask's order and the parent will handle the rest
    } else {
      // Dropped over a section (assuming section id is passed as droppable id)
      newSectionId = overId;
      // Find max order in that section and add 1
      const sectionTasks = projectTasks.filter(t => (t.sectionId || 'todo') === newSectionId);
      newOrder = sectionTasks.length > 0 ? Math.max(...sectionTasks.map(t => t.order || 0)) + 1 : 0;
    }

    onReorder(activeId, newSectionId, newOrder);
  };

  const togglePriorityFilter = (priority: Priority) => {
    const newPriority = filters.priority.includes(priority)
      ? filters.priority.filter(p => p !== priority)
      : [...filters.priority, priority];
    onFilterChange({ ...filters, priority: newPriority });
  };

  const toggleTagFilter = (tagName: string) => {
    const newTags = filters.tags.includes(tagName)
      ? filters.tags.filter(t => t !== tagName)
      : [...filters.tags, tagName];
    onFilterChange({ ...filters, tags: newTags });
  };

  const setCompletionFilter = (status: 'all' | 'completed' | 'active') => {
    onFilterChange({ ...filters, completed: status });
  };

  const clearFilters = () => {
    onFilterChange({
      priority: [],
      tags: [],
      completed: 'all',
    });
  };

  const activeFilterCount = filters.priority.length + filters.tags.length + (filters.completed !== 'all' ? 1 : 0);

  const FilterContent = () => (
    <div className="w-64 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium leading-none">Filters</h4>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
            Clear all
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
          <div className="flex flex-col gap-1">
            {(['all', 'active', 'completed'] as const).map((status) => (
              <Button
                key={status}
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-start font-normal h-8",
                  filters.completed === status && "bg-accent text-accent-foreground"
                )}
                onClick={() => setCompletionFilter(status)}
              >
                <div className={cn(
                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                  filters.completed === status ? "bg-primary text-primary-foreground" : "opacity-50"
                )}>
                  {filters.completed === status && <Check className="h-3 w-3" />}
                </div>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</p>
          <div className="flex flex-col gap-1">
            {(['urgent', 'high', 'medium', 'low'] as Priority[]).map((priority) => (
              <Button
                key={priority}
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-start font-normal h-8",
                  filters.priority.includes(priority) && "bg-accent text-accent-foreground"
                )}
                onClick={() => togglePriorityFilter(priority)}
              >
                <div className={cn(
                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                  filters.priority.includes(priority) ? "bg-primary text-primary-foreground" : "opacity-50"
                )}>
                  {filters.priority.includes(priority) && <Check className="h-3 w-3" />}
                </div>
                <AlertCircle className={cn(
                  "mr-2 h-3 w-3",
                  priority === 'urgent' ? "text-red-500" :
                  priority === 'high' ? "text-orange-500" :
                  priority === 'medium' ? "text-blue-500" : "text-gray-400"
                )} />
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</p>
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
            {tags.map((tag) => (
              <Button
                key={tag.id}
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-start font-normal h-8",
                  filters.tags.includes(tag.name) && "bg-accent text-accent-foreground"
                )}
                onClick={() => toggleTagFilter(tag.name)}
              >
                <div className={cn(
                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                  filters.tags.includes(tag.name) ? "bg-primary text-primary-foreground" : "opacity-50"
                )}>
                  {filters.tags.includes(tag.name) && <Check className="h-3 w-3" />}
                </div>
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

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
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 min-w-[20px] justify-center">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <FilterContent />
            </PopoverContent>
          </Popover>
          <Button onClick={onAddTask} size="sm" className="h-9 rounded-full px-4">
            <Plus className="w-4 h-4 mr-2" /> Add Task
          </Button>
        </div>
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
                <p className="text-sm text-muted-foreground">Try adjusting your filters or add a new task.</p>
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
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-background/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold tracking-tight">
                {activeProject?.name || 'Board'}
              </h2>
              <Badge variant="secondary" className="h-6">
                {projectTasks.length} tasks
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2">
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 min-w-[20px] justify-center">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-0">
                  <FilterContent />
                </PopoverContent>
              </Popover>
              <Button onClick={onAddTask} size="sm" className="h-9 rounded-full px-4">
                <Plus className="w-4 h-4 mr-2" /> Add Task
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <div className="h-full flex gap-6 p-6 min-w-max">
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
                      <SortableContext 
                        items={sectionTasks.map(t => t.id)}
                        strategy={verticalListSortingStrategy}
                      >
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
                      </SortableContext>
                    </ScrollArea>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DndContext>
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
