import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2, AlertTriangle, Clock, TrendingDown } from "lucide-react";
import { db, Reminder } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    const data = await db.getAll<Reminder>('reminders');
    setReminders(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleResolve = async (id: number) => {
    try {
      const reminder = reminders.find(r => r.id === id);
      if (reminder) {
        await db.update('reminders', { ...reminder, resolved: true });
        toast({ title: "Success", description: "Reminder marked as resolved" });
        loadReminders();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to resolve reminder", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await db.delete('reminders', id);
      toast({ title: "Success", description: "Reminder deleted" });
      loadReminders();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete reminder", variant: "destructive" });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return TrendingDown;
      case 'expiry':
        return Clock;
      case 'broken':
        return AlertTriangle;
      default:
        return Bell;
    }
  };

  const getVariant = (type: string) => {
    switch (type) {
      case 'low_stock':
        return 'warning';
      case 'expiry':
        return 'warning';
      case 'broken':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const activeReminders = reminders.filter(r => !r.resolved);
  const resolvedReminders = reminders.filter(r => r.resolved);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold">Reminders & Alerts</h2>
        <p className="text-muted-foreground">Track and manage lab alerts and notifications</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Active Alerts ({activeReminders.length})
        </h3>
        {activeReminders.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No active alerts at this time
          </Card>
        ) : (
          <div className="grid gap-3">
            {activeReminders.map((reminder) => {
              const Icon = getIcon(reminder.type);
              const variant = getVariant(reminder.type);
              
              return (
                <Card key={reminder.id} className={`p-4 border-l-4 ${
                  variant === 'warning' ? 'border-l-warning' :
                  variant === 'destructive' ? 'border-l-destructive' :
                  'border-l-primary'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        variant === 'warning' ? 'bg-warning/10 text-warning' :
                        variant === 'destructive' ? 'bg-destructive/10 text-destructive' :
                        'bg-primary/10 text-primary'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={variant === 'default' ? 'default' : 'outline'}>
                            {reminder.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(reminder.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{reminder.message}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleResolve(reminder.id)}
                        title="Mark as Resolved"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(reminder.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {resolvedReminders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Check className="h-5 w-5" />
            Resolved ({resolvedReminders.length})
          </h3>
          <div className="grid gap-3">
            {resolvedReminders.slice(0, 5).map((reminder) => {
              const Icon = getIcon(reminder.type);
              
              return (
                <Card key={reminder.id} className="p-4 bg-muted/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">
                            {reminder.type.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">Resolved</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(reminder.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{reminder.message}</p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(reminder.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
