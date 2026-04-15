import React from 'react';
import { Search, Plus, Moon, Sun, Bell, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddTask: () => void;
  onToggleTheme: () => void;
  theme: 'light' | 'dark';
  onAiSuggest: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  searchQuery,
  onSearchChange,
  onAddTask,
  onToggleTheme,
  theme,
  onAiSuggest,
}) => {
  return (
    <div className="h-16 border-b bg-background flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex-1 max-w-xl relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks, projects, tags..."
          className="pl-10 bg-muted/50 border-none focus-visible:ring-1"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onAiSuggest} className="text-primary hover:text-primary hover:bg-primary/10">
                <Sparkles className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>AI Prioritization</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button onClick={onAddTask} className="gap-2">
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </Button>

        <div className="flex items-center gap-1 border-l pl-3 ml-3">
          <Button variant="ghost" size="icon">
            <Bell className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggleTheme}>
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
