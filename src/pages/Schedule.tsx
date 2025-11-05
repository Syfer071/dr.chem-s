import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { db, ScheduleEntry } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export default function Schedule() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; period: number } | null>(null);
  const [formData, setFormData] = useState({ className: '', experiment: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    const data = await db.getAll<ScheduleEntry>('schedule');
    setSchedule(data);
  };

  const getEntry = (day: number, period: number) => {
    return schedule.find(e => e.day === day && e.period === period);
  };

  const handleSlotClick = (day: number, period: number) => {
    const entry = getEntry(day, period);
    setSelectedSlot({ day, period });
    if (entry) {
      setFormData({ className: entry.className, experiment: entry.experiment });
    } else {
      setFormData({ className: '', experiment: '' });
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!selectedSlot) return;

    try {
      const existing = getEntry(selectedSlot.day, selectedSlot.period);
      
      if (existing) {
        await db.update('schedule', {
          ...existing,
          className: formData.className,
          experiment: formData.experiment,
        });
      } else {
        await db.add<ScheduleEntry>('schedule', {
          day: selectedSlot.day,
          period: selectedSlot.period,
          className: formData.className,
          experiment: formData.experiment,
        });
      }

      toast({ title: "Success", description: "Schedule updated successfully" });
      loadSchedule();
      setShowForm(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update schedule", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedSlot) return;
    const existing = getEntry(selectedSlot.day, selectedSlot.period);
    
    if (existing) {
      try {
        await db.delete('schedule', existing.id);
        toast({ title: "Success", description: "Schedule entry deleted" });
        loadSchedule();
        setShowForm(false);
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete entry", variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold">Lab Schedule</h2>
        <p className="text-muted-foreground">6 working days × 8 periods schedule grid</p>
      </div>

      <div className="bg-card rounded-lg shadow-card overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-3 bg-muted font-semibold text-sm">Period</th>
              {DAYS.map((day, idx) => (
                <th key={idx} className="border p-3 bg-muted font-semibold text-sm">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period, periodIdx) => (
              <tr key={periodIdx}>
                <td className="border p-3 bg-muted text-center font-medium">
                  {period}
                </td>
                {DAYS.map((_, dayIdx) => {
                  const entry = getEntry(dayIdx, periodIdx);
                  return (
                    <td
                      key={dayIdx}
                      className="border p-2 cursor-pointer hover:bg-accent/50 transition-colors min-w-[150px]"
                      onClick={() => handleSlotClick(dayIdx, periodIdx)}
                    >
                      {entry ? (
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{entry.className}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {entry.experiment}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground text-center">
                          Click to add
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Schedule Entry - {selectedSlot && `${DAYS[selectedSlot.day]} Period ${PERIODS[selectedSlot.period]}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="className">Class / Department</Label>
              <Input
                id="className"
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                placeholder="e.g., Class 12-A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experiment">Experiment / Chemical Requirement</Label>
              <Input
                id="experiment"
                value={formData.experiment}
                onChange={(e) => setFormData({ ...formData, experiment: e.target.value })}
                placeholder="e.g., Titration Experiment"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {getEntry(selectedSlot?.day || 0, selectedSlot?.period || 0) && (
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
