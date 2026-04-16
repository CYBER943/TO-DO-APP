import React from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Flag, 
  MoreVertical, 
  Edit2, 
  Trash2,
  Paperclip,
  MessageSquare
} from 'lucide-react';
import { Task, Priority } from '../types';
import { cn } from '../../lib/utils';
import { format, isPast, isToday } from 'date-fns';
import { Badge } from '../../components/ui/badge';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Button } from '../../components/ui/button';
import { motion } from 'motion/react';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const priorityColors: Record<Priority, string> = {
  low: 'text-blue-500',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
};

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && !task.completed;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group flex items-start gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing",
        task.completed && "opacity-60",
        isDragging && "opacity-50 shadow-2xl border-primary/50"
      )}
    >
      <button 
        onClick={() => onToggleComplete(task.id)}
        className="mt-1 transition-transform hover:scale-110 active:scale-95"
      >
        {task.completed ? (
          <CheckCircle2 className="w-5 h-5 text-primary fill-primary/10" />
        ) : (
          <Circle className={cn("w-5 h-5", priorityColors[task.priority])} />
        )}
      </button>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className={cn(
              "font-medium truncate",
              task.completed && "line-through text-muted-foreground"
            )}>
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {task.description}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Edit2 className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {task.dueDate && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted",
              isOverdue && "text-red-500 bg-red-500/10"
            )}>
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(task.dueDate), "MMM d")}</span>
            </div>
          )}

          {task.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {task.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-[10px] h-4 px-1.5 font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 ml-auto">
            {task.subtasks.length > 0 && (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
              </div>
            )}
            {task.attachments.length > 0 && (
              <Paperclip className="w-3 h-3" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskItem;
