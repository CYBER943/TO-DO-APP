import React from 'react';
import { 
  Inbox, 
  Calendar, 
  CalendarDays, 
  Hash, 
  Plus, 
  ChevronDown, 
  Layout, 
  BarChart3,
  User,
  Briefcase,
  Folder,
  LogOut,
  Target,
  Minus
} from 'lucide-react';
import { Project, Tag, ViewType, Task } from '../types';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Separator } from '../../components/ui/separator';
import { auth, signOut, User as FirebaseUser } from '../lib/firebase';

interface SidebarProps {
  projects: Project[];
  tags: Tag[];
  activeProjectId: string;
  activeView: ViewType;
  onProjectSelect: (id: string) => void;
  onViewSelect: (view: ViewType) => void;
  onAddProject: () => void;
  user: FirebaseUser | null;
  tasks?: Task[];
  dailyFocusGoal?: number;
  onUpdateDailyFocusGoal?: (goal: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  projects,
  tags,
  activeProjectId,
  activeView,
  onProjectSelect,
  onViewSelect,
  onAddProject,
  user,
  tasks = [],
  dailyFocusGoal = 3,
  onUpdateDailyFocusGoal,
}) => {
  const navItems = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, view: 'list' as ViewType },
    { id: 'today', label: 'Today', icon: Calendar, view: 'list' as ViewType },
    { id: 'upcoming', label: 'Upcoming', icon: CalendarDays, view: 'list' as ViewType },
  ];

  const viewItems = [
    { id: 'board', label: 'Board', icon: Layout, view: 'board' as ViewType },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays, view: 'calendar' as ViewType },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, view: 'analytics' as ViewType },
  ];

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'User': return User;
      case 'Briefcase': return Briefcase;
      default: return Folder;
    }
  };

  const todayStr = React.useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const { completedCount, totalFocusCount } = React.useMemo(() => {
    const todayFocusTasks = tasks.filter(t => 
      t.isFocus && 
      (t.dueDate === todayStr || t.updatedAt?.startsWith(todayStr))
    );
    return {
      completedCount: todayFocusTasks.filter(t => t.completed).length,
      totalFocusCount: todayFocusTasks.length
    };
  }, [tasks, todayStr]);

  const radius = 22;
  const strokeWidth = 3.5;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const percent = dailyFocusGoal > 0 ? Math.min(Math.round((completedCount / dailyFocusGoal) * 100), 100) : 0;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="w-64 h-full bg-sidebar border-r flex flex-col">
      <div className="p-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-foreground font-bold">Z</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight">ZenTask</h1>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 py-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={activeProjectId === item.id ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-3"
              onClick={() => {
                onProjectSelect(item.id);
                onViewSelect(item.view);
              }}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Button>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1 py-2">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Views
          </div>
          {viewItems.map((item) => (
            <Button
              key={item.id}
              variant={activeView === item.view ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-3"
              onClick={() => onViewSelect(item.view)}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Button>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Daily Focus Goal Progress Ring Card */}
        <div className="mx-3 bg-muted/30 border rounded-xl p-3.5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  className="text-muted-foreground/10"
                  strokeWidth={strokeWidth}
                  stroke="currentColor"
                  fill="transparent"
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
                <circle
                  className="text-primary transition-all duration-300 ease-in-out"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference + ' ' + circumference}
                  style={{ strokeDashoffset }}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-foreground">
                  {percent}%
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <Target className="w-3.5 h-3.5 text-primary animate-pulse" />
                <span>Focus Goal</span>
              </div>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {completedCount} of {dailyFocusGoal} done
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1.5 border-t border-muted/50 text-xs">
            <span className="text-muted-foreground">Daily Target:</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-md hover:bg-muted"
                onClick={() => {
                  if (onUpdateDailyFocusGoal && dailyFocusGoal > 1) {
                    onUpdateDailyFocusGoal(dailyFocusGoal - 1);
                  }
                }}
                disabled={dailyFocusGoal <= 1}
              >
                <Minus className="w-2.5 h-2.5" />
              </Button>
              <span className="font-bold w-4 text-center">{dailyFocusGoal}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-md hover:bg-muted"
                onClick={() => {
                  if (onUpdateDailyFocusGoal && dailyFocusGoal < 10) {
                    onUpdateDailyFocusGoal(dailyFocusGoal + 1);
                  }
                }}
                disabled={dailyFocusGoal >= 10}
              >
                <Plus className="w-2.5 h-2.5" />
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-1 py-2">
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Projects
            </span>
            <Button variant="ghost" size="icon" className="h-4 w-4" onClick={onAddProject}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {projects.filter(p => p.id !== 'inbox').map((project) => {
            const Icon = getIcon(project.icon);
            return (
              <Button
                key={project.id}
                variant={activeProjectId === project.id ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3"
                onClick={() => onProjectSelect(project.id)}
              >
                <Icon className="w-4 h-4" style={{ color: project.color }} />
                {project.name}
              </Button>
            );
          })}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1 py-2">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tags
          </div>
          {tags.map((tag) => (
            <Button
              key={tag.id}
              variant="ghost"
              className="w-full justify-start gap-3"
            >
              <Hash className="w-4 h-4" style={{ color: tag.color }} />
              {tag.name}
            </Button>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t space-y-2">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.displayName || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || 'Free Plan'}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={() => signOut(auth)}
        >
          <LogOut className="w-4 h-4" />
          Log out
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
