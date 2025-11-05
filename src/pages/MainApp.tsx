import { useState } from "react";
import { TabNavigation } from "@/components/TabNavigation";
import Dashboard from "./Dashboard";
import Chemicals from "./Chemicals";
import EquipmentPage from "./Equipment";
import BrokenItems from "./BrokenItems";
import UsageLogs from "./UsageLogs";
import Reports from "./Reports";
import Schedule from "./Schedule";
import Reminders from "./Reminders";
import Settings from "./Settings";
import { User } from "@/lib/db";
import { FlaskConical, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MainAppProps {
  user: User;
  onLogout: () => void;
}

export default function MainApp({ user, onLogout }: MainAppProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(user);

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('dr_chems_user', JSON.stringify(updatedUser));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'chemicals':
        return <Chemicals />;
      case 'equipment':
        return <EquipmentPage />;
      case 'broken':
        return <BrokenItems />;
      case 'logs':
        return <UsageLogs />;
      case 'reports':
        return <Reports />;
      case 'schedule':
        return <Schedule />;
      case 'reminders':
        return <Reminders />;
      case 'settings':
        return <Settings user={currentUser} onUpdate={handleUserUpdate} />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FlaskConical className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">DR.CHEM'S</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">{currentUser.email}</p>
              </div>
              <Button variant="outline" size="icon" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {renderContent()}
      </main>
    </div>
  );
}
