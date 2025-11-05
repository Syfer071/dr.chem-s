import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db, BrokenItem } from "@/lib/db";
import { ReminderService } from "@/lib/reminderService";

interface BrokenItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BrokenItemForm({ open, onOpenChange, onSuccess }: BrokenItemFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    type: "chemical" as "chemical" | "equipment",
    quantity: "",
    cause: "",
    reportedBy: "",
    date: new Date().toISOString().split('T')[0],
    remarks: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newItem: Omit<BrokenItem, 'id'> = {
        name: formData.name,
        type: formData.type,
        quantity: Number(formData.quantity),
        cause: formData.cause,
        reportedBy: formData.reportedBy,
        date: formData.date,
        remarks: formData.remarks,
      };

      await db.add<BrokenItem>('brokenItems', newItem);
      
      // Create reminder for broken item
      await ReminderService.createBrokenItemReminder(formData.name, formData.type);

      toast({
        title: "Success",
        description: "Broken item added successfully",
      });

      setFormData({
        name: "",
        type: "chemical",
        quantity: "",
        cause: "",
        reportedBy: "",
        date: new Date().toISOString().split('T')[0],
        remarks: "",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add broken item",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[500px] lg:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Add Broken Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: "chemical" | "equipment") =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chemical">Chemical</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cause">Cause</Label>
            <Textarea
              id="cause"
              value={formData.cause}
              onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
              placeholder="Describe what happened..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportedBy">Reported By</Label>
            <Input
              id="reportedBy"
              value={formData.reportedBy}
              onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Additional notes or remarks..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Broken Item</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
