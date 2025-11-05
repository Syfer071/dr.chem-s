import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { db, Chemical, Equipment, UsageLog, BrokenItem, Reminder } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { ReminderService } from "@/lib/reminderService";

interface UsageLogFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Chemical | Equipment;
  itemType: 'chemical' | 'equipment';
  onSuccess: () => void;
}

export function UsageLogForm({ open, onOpenChange, item, itemType, onSuccess }: UsageLogFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    quantityUsed: 0,
    usedBy: '',
    purpose: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Add usage log
      await db.add<UsageLog>('usageLogs', {
        itemType,
        itemId: item.id,
        itemName: item.name,
        quantityUsed: formData.quantityUsed,
        usedBy: formData.usedBy,
        purpose: formData.purpose,
        date: formData.date,
      });

      // Update item quantity if it's a chemical
      if (itemType === 'chemical') {
        const chemical = item as Chemical;
        const newQuantity = chemical.quantity - formData.quantityUsed;
        
        await db.update('chemicals', {
          ...chemical,
          quantity: newQuantity,
        });

        // Check if low stock
        if (newQuantity <= chemical.minLimit && newQuantity > 0) {
          await db.add<Reminder>('reminders', {
            type: 'low_stock',
            message: `Low stock alert: ${chemical.name} is below minimum limit (${newQuantity}${chemical.unit} remaining)`,
            date: new Date().toISOString(),
            resolved: false,
            itemId: chemical.id,
          });
        }

        // Check if depleted
        if (newQuantity <= 0) {
          await db.add<BrokenItem>('brokenItems', {
            type: 'chemical',
            name: chemical.name,
            quantity: 0,
            cause: 'Depleted through usage',
            reportedBy: formData.usedBy,
            date: new Date().toISOString(),
            remarks: 'Stock depleted',
          });
        }
      }

      // Check and create reminders after usage
      await ReminderService.checkAndCreateReminders();
      
      toast({ title: "Success", description: "Usage logged successfully" });
      onSuccess();
      onOpenChange(false);
      setFormData({
        quantityUsed: 0,
        usedBy: '',
        purpose: '',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to log usage",
        variant: "destructive" 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[500px] lg:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Usage - {item.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantityUsed">Quantity Used *</Label>
            <Input
              id="quantityUsed"
              type="number"
              step="0.01"
              value={formData.quantityUsed}
              onChange={(e) => setFormData({ ...formData, quantityUsed: parseFloat(e.target.value) })}
              required
              max={itemType === 'chemical' ? (item as Chemical).quantity : undefined}
            />
            {itemType === 'chemical' && (
              <p className="text-xs text-muted-foreground">
                Available: {(item as Chemical).quantity} {(item as Chemical).unit}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="usedBy">Used By (Class/Staff/Student) *</Label>
            <Input
              id="usedBy"
              value={formData.usedBy}
              onChange={(e) => setFormData({ ...formData, usedBy: e.target.value })}
              placeholder="e.g., Class 12-A, Prof. Smith"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose / Experiment Name *</Label>
            <Textarea
              id="purpose"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="Describe the experiment or purpose"
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Log Usage</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
