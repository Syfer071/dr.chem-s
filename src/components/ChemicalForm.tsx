import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { db, Chemical } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { ReminderService } from "@/lib/reminderService";

interface ChemicalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chemical?: Chemical;
  onSuccess: () => void;
}

export function ChemicalForm({ open, onOpenChange, chemical, onSuccess }: ChemicalFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    quantity: 0,
    unit: 'ml',
    location: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    minLimit: 0,
    condition: 'normal' as 'normal' | 'used' | 'broken',
    notes: '',
  });

  useEffect(() => {
    if (chemical) {
      setFormData({
        name: chemical.name,
        brand: chemical.brand,
        quantity: chemical.quantity,
        unit: chemical.unit,
        location: chemical.location,
        purchaseDate: chemical.purchaseDate,
        expiryDate: chemical.expiryDate,
        minLimit: chemical.minLimit,
        condition: chemical.condition,
        notes: chemical.notes,
      });
    } else {
      setFormData({
        name: '',
        brand: '',
        quantity: 0,
        unit: 'ml',
        location: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        minLimit: 0,
        condition: 'normal',
        notes: '',
      });
    }
  }, [chemical, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (chemical) {
        await db.update('chemicals', { ...formData, id: chemical.id });
        // Resolve reminders if stock is restored
        if (formData.quantity > formData.minLimit && chemical.quantity <= chemical.minLimit) {
          await ReminderService.resolveItemReminders(chemical.id, 'low_stock');
        }
        toast({ title: "Success", description: "Chemical updated successfully" });
      } else {
        await db.add('chemicals', formData);
        toast({ title: "Success", description: "Chemical added successfully" });
      }
      
      // Check and create reminders
      await ReminderService.checkAndCreateReminders();
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to save chemical",
        variant: "destructive" 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{chemical ? 'Edit Chemical' : 'Add New Chemical'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Chemical Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="mg">mg</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minLimit">Min Stock *</Label>
              <Input
                id="minLimit"
                type="number"
                step="0.01"
                value={formData.minLimit}
                onChange={(e) => setFormData({ ...formData, minLimit: parseFloat(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Storage Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Cabinet A, Shelf 3"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date *</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select value={formData.condition} onValueChange={(value: any) => setFormData({ ...formData, condition: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="broken">Broken</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Remarks</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes or safety information"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {chemical ? 'Update' : 'Add'} Chemical
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
