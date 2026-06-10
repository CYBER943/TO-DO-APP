import React from 'react';
import { Task, ViewType, Project, Section, Tag, TaskFilters, Priority } from '../types';
import TaskItem from './TaskItem';
import { ScrollArea } from '../../components/ui/scroll-area';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DndContext, 
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, MoreHorizontal, Filter, Check, X, Tag as TagIcon, AlertCircle, LayoutList } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Separator } from '../../components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { cn } from '../../lib/utils';
import { Input } from '@/components/ui/input';

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
  onAddTask: (sectionId?: string) => void;
  onReorder: (taskId: string, newSectionId: string, newOrder: number) => void;
  onAddSection: (name: string) => void;
  onUpdateSection: (id: string, name: string) => void;
  onDeleteSection: (id: string) => void;
  onToggleFocus?: (id: string) => void;
}

interface BoardColumnProps {
  section: { id: string, name: string };
  sectionTasks: Task[];
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onAddTask: (sectionId?: string) => void;
  onUpdateSection: (id: string, name: string) => void;
  onDeleteSection: (id: string) => void;
  onToggleFocus?: (id: string) => void;
}

const BoardColumn: React.FC<BoardColumnProps> = ({
  section,
  sectionTasks,
  onToggleComplete,
  onEdit,
  onDelete,
  onAddTask,
  onUpdateSection,
  onDeleteSection,
  onToggleFocus,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [newName, setNewName] = React.useState(section.name);

  const { setNodeRef, isOver } = useDroppable({
    id: section.id,
  });

  const handleUpdateName = () => {
    if (newName.trim() && newName !== section.name) {
      onUpdateSection(section.id, newName);
    }
    setIsEditing(false);
  };

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-80 flex flex-col gap-4 rounded-xl transition-colors duration-200",
        isOver && "bg-primary/5"
      )}
    >
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditing ? (
            <input
              autoFocus
              className="bg-background border-none focus:ring-0 p-0 font-semibold w-full"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleUpdateName}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
            />
          ) : (
            <h3 
              className="font-semibold truncate cursor-pointer hover:text-primary transition-colors"
              onClick={() => setIsEditing(true)}
            >
              {section.name}
            </h3>
          )}
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
            {sectionTasks.length}
          </Badge>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              Rename
            </DropdownMenuItem>
            <Separator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => onDeleteSection(section.id)}
            >
              Delete Section
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="flex-1">
        <SortableContext 
          items={sectionTasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3 pb-4 px-1">
            {sectionTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleFocus={onToggleFocus}
              />
            ))}
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground border border-dashed border-transparent hover:border-muted-foreground/20"
              onClick={() => onAddTask(section.id)}
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </Button>
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
};

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
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onToggleFocus,
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
  const projectTasks = [...tasks].sort((a, b) => 
    (a.order || 0) - (b.order || 0) || 
    a.updatedAt.localeCompare(b.updatedAt)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the task being dragged
    const draggedTask = projectTasks.find(t => t.id === activeId);
    if (!draggedTask) return;

    // Check if we dropped over a task
    const overTask = projectTasks.find(t => t.id === overId);
    
    let newSectionId = draggedTask.sectionId || 'todo';
    let newOrder = draggedTask.order || 0;

    // Dropped directly on a column or container
    newSectionId = overId;
    if (draggedTask.sectionId === newSectionId && view === 'board') return;

    const sectionTasks = projectTasks.filter(t => 
      (t.sectionId || 'todo') === newSectionId
    );
    
    if (view === 'list') {
      // In list view, we just reorder within projectTasks
      const oldIndex = projectTasks.findIndex(t => t.id === activeId);
      const overIndex = overTask ? projectTasks.findIndex(t => t.id === overId) : -1;
      
      if (overIndex !== -1) {
        const reordered = arrayMove(projectTasks, oldIndex, overIndex);
        const newIdx = reordered.findIndex(t => t.id === activeId);
        
        let calculatedOrder: number;
        if (newIdx === 0) {
          calculatedOrder = (reordered[1]?.order || 0) - 1000;
        } else if (newIdx === reordered.length - 1) {
          calculatedOrder = (reordered[reordered.length - 2]?.order || 0) + 1000;
        } else {
          calculatedOrder = ((reordered[newIdx - 1]?.order || 0) + (reordered[newIdx + 1]?.order || 0)) / 2;
        }
        onReorder(activeId, draggedTask.sectionId || 'todo', calculatedOrder);
      }
      return;
    }

    if (overTask) {
      newSectionId = overTask.sectionId || 'todo';
      if (activeId === overId) return;

      const filteredSectionTasks = projectTasks.filter(t => 
        (t.sectionId || 'todo') === newSectionId
      );
      
      const oldIndex = filteredSectionTasks.findIndex(t => t.id === activeId);
      const overIndex = filteredSectionTasks.findIndex(t => t.id === overId);
      
      const reordered = arrayMove(filteredSectionTasks, oldIndex, overIndex);
      const newIdx = reordered.findIndex(t => t.id === activeId);
      
      let calculatedOrder: number;
      if (reordered.length === 1) {
        calculatedOrder = 0;
      } else if (newIdx === 0) {
        calculatedOrder = (reordered[1]?.order || 0) - 1000;
      } else if (newIdx === reordered.length - 1) {
        calculatedOrder = (reordered[reordered.length - 2]?.order || 0) + 1000;
      } else {
        calculatedOrder = ((reordered[newIdx - 1]?.order || 0) + (reordered[newIdx + 1]?.order || 0)) / 2;
      }
      onReorder(activeId, newSectionId, calculatedOrder);
    } else {
      // Dropped on empty section
      const tasksInNewSection = projectTasks.filter(t => (t.sectionId || 'todo') === newSectionId);
      newOrder = tasksInNewSection.length > 0 ? Math.max(...tasksInNewSection.map(t => t.order || 0)) + 1000 : 0;
      onReorder(activeId, newSectionId, newOrder);
    }
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

  const renderListView = () => {
    return (
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
            <Button onClick={() => onAddTask()} size="sm" className="h-9 rounded-full px-4">
              <Plus className="w-4 h-4 mr-2" /> Add Task
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <SortableContext 
            items={projectTasks.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <AnimatePresence mode="popLayout">
              {projectTasks.length > 0 ? (
                projectTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleFocus={onToggleFocus}
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
                  <Button variant="outline" onClick={() => onAddTask()}>Add Task</Button>
                </motion.div>
              )}
            </AnimatePresence>
          </SortableContext>
        </div>
      </div>
    );
  };

  const renderBoardView = () => {
    const projectSections = sections.filter(s => s.projectId === activeProjectId);
    const defaultSections = [
      { id: 'todo', name: 'To Do' },
      { id: 'inprogress', name: 'In Progress' },
      { id: 'completed', name: 'Completed' }
    ];
    const displaySections = projectSections.length > 0 ? projectSections : defaultSections;

    const [isAddingSection, setIsAddingSection] = React.useState(false);
    const [sectionName, setSectionName] = React.useState('');

    const handleAddSection = () => {
      if (sectionName.trim()) {
        onAddSection(sectionName);
        setSectionName('');
        setIsAddingSection(false);
      }
    };

    return (
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
            <Button onClick={() => onAddTask()} size="sm" className="h-9 rounded-full px-4">
              <Plus className="w-4 h-4 mr-2" /> Add Task
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-x-auto">
          <div className="h-full flex items-start gap-6 p-6 min-w-max">
            {displaySections.map(section => (
              <BoardColumn
                key={section.id}
                section={section}
                sectionTasks={projectTasks.filter(t => 
                  section.id === 'completed' ? t.completed : (t.sectionId === section.id || (!t.sectionId && section.id === 'todo'))
                )}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddTask={onAddTask}
                onUpdateSection={onUpdateSection}
                onDeleteSection={onDeleteSection}
                onToggleFocus={onToggleFocus}
              />
            ))}

            {activeProjectId !== 'all' && !['inbox', 'today', 'upcoming'].includes(activeProjectId) && (
              <div className="w-80 flex-shrink-0">
                {isAddingSection ? (
                  <div className="bg-card rounded-xl border p-4 space-y-4">
                    <Input
                      autoFocus
                      placeholder="Section name..."
                      value={sectionName}
                      onChange={(e) => setSectionName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={handleAddSection}>Add Section</Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsAddingSection(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2 h-12 rounded-xl border border-dashed border-muted-foreground/20 hover:border-muted-foreground/50 text-muted-foreground"
                    onClick={() => setIsAddingSection(true)}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Section</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
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
    </DndContext>
  );
};

export default TaskView;
