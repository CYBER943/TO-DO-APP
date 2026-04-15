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
  LogOut
} from 'lucide-react';
import { Project, Tag, ViewType } from '../types';
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
