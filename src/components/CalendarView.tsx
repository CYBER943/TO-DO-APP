import React, { useState } from 'react';
import { Task } from '../types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { Badge } from '../../components/ui/badge';

interface CalendarViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onAddTask: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onEditTask, onAddTask }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const priorityColors: Record<string, string> = {
    low: 'bg-blue-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500',
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 ml-2" onClick={() => setCurrentMonth(new Date())}>
              Today
            </Button>
          </div>
        </div>
        <Button onClick={onAddTask} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Add Task
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1 min-h-[600px]">
          {calendarDays.map((day, idx) => {
            const dayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));
            const isCurrentMonth = isSameMonth(day, monthStart);

            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[120px] p-2 border-r border-b transition-colors hover:bg-muted/10",
                  !isCurrentMonth && "bg-muted/20 text-muted-foreground"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                    isToday(day) && "bg-primary text-primary-foreground"
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>

                <div className="space-y-1">
                  {dayTasks.slice(0, 4).map(task => (
                    <button
                      key={task.id}
                      onClick={() => onEditTask(task)}
                      className={cn(
                        "w-full text-left px-2 py-1 rounded text-[10px] font-medium truncate transition-colors",
                        task.completed ? "bg-muted text-muted-foreground line-through" : "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <div className={cn("w-1.5 h-1.5 rounded-full", priorityColors[task.priority])} />
                        {task.title}
                      </div>
                    </button>
                  ))}
                  {dayTasks.length > 4 && (
                    <p className="text-[10px] text-muted-foreground pl-2">
                      + {dayTasks.length - 4} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
