import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, 
  FlaskConical, 
  Wrench, 
  AlertTriangle, 
  ClipboardList,
  FileBarChart,
  Calendar,
  Bell,
  Settings
} from "lucide-react";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { value: 'chemicals', label: 'Chemicals', icon: FlaskConical },
    { value: 'equipment', label: 'Equipment', icon: Wrench },
    { value: 'broken', label: 'Broken', icon: AlertTriangle },
    { value: 'logs', label: 'Logs', icon: ClipboardList },
    { value: 'reports', label: 'Reports', icon: FileBarChart },
    { value: 'schedule', label: 'Schedule', icon: Calendar },
    { value: 'reminders', label: 'Reminders', icon: Bell },
    { value: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-card shadow-card p-1 h-auto">
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.value} 
            value={tab.value}
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
