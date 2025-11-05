import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { 
  FlaskConical, 
  Wrench, 
  AlertTriangle, 
  TrendingDown,
  Clock,
  DollarSign,
  Plus
} from "lucide-react";
import { db, Chemical, Equipment, BrokenItem } from "@/lib/db";
import { ReminderService } from "@/lib/reminderService";

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    totalChemicals: 0,
    totalEquipment: 0,
    lowStock: 0,
    expiringSoon: 0,
    broken: 0,
    stockValue: 0,
  });

  useEffect(() => {
    loadStats();
    // Check reminders on dashboard load
    ReminderService.checkAndCreateReminders();
  }, []);

  const loadStats = async () => {
    const chemicals = await db.getAll<Chemical>('chemicals');
    const equipment = await db.getAll<Equipment>('equipment');
    const broken = await db.getAll<BrokenItem>('brokenItems');

    const lowStock = chemicals.filter(c => 
      c.condition === 'normal' && c.quantity <= c.minLimit
    ).length;

    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringSoon = chemicals.filter(c => {
      const expiryDate = new Date(c.expiryDate);
      return expiryDate <= thirtyDaysFromNow && expiryDate > today;
    }).length;

    setStats({
      totalChemicals: chemicals.length,
      totalEquipment: equipment.length,
      lowStock,
      expiringSoon,
      broken: broken.length,
      stockValue: chemicals.length * 1000 + equipment.length * 5000, // Mock calculation
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your laboratory inventory</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onNavigate('chemicals')} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Chemical
          </Button>
          <Button onClick={() => onNavigate('equipment')} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Equipment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Chemicals"
          value={stats.totalChemicals}
          icon={FlaskConical}
          variant="default"
        />
        <StatCard
          title="Total Equipment"
          value={stats.totalEquipment}
          icon={Wrench}
          variant="default"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStock}
          icon={TrendingDown}
          variant="warning"
        />
        <StatCard
          title="Expiring Soon"
          value={stats.expiringSoon}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Broken / Damaged"
          value={stats.broken}
          icon={AlertTriangle}
          variant="destructive"
        />
        <StatCard
          title="Stock Value"
          value={`₹${stats.stockValue.toLocaleString()}`}
          icon={DollarSign}
          variant="accent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card p-6 rounded-lg shadow-card">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => onNavigate('chemicals')}
            >
              <FlaskConical className="mr-2 h-4 w-4" />
              Manage Chemicals
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => onNavigate('equipment')}
            >
              <Wrench className="mr-2 h-4 w-4" />
              Manage Equipment
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => onNavigate('reports')}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-card">
          <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            {stats.lowStock > 0 && (
              <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg">
                <TrendingDown className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Low Stock Alert</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.lowStock} item(s) below minimum stock level
                  </p>
                </div>
              </div>
            )}
            {stats.expiringSoon > 0 && (
              <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg">
                <Clock className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Expiry Warning</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.expiringSoon} chemical(s) expiring within 30 days
                  </p>
                </div>
              </div>
            )}
            {stats.broken > 0 && (
              <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Damaged Items</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.broken} broken or damaged item(s) reported
                  </p>
                </div>
              </div>
            )}
            {stats.lowStock === 0 && stats.expiringSoon === 0 && stats.broken === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No alerts at this time
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
