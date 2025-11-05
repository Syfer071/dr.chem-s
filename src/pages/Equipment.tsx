import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit, Trash2, Activity, AlertTriangle } from "lucide-react";
import { db, Equipment, BrokenItem } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ReminderService } from "@/lib/reminderService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EquipmentForm } from "@/components/EquipmentForm";
import { UsageLogForm } from "@/components/UsageLogForm";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showUsageLog, setShowUsageLog] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | undefined>();
  const [deleteEquipment, setDeleteEquipment] = useState<Equipment | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    const data = await db.getAll<Equipment>('equipment');
    setEquipment(data);
  };

  const filteredEquipment = equipment.filter(eq =>
    eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setShowForm(true);
  };

  const handleLogUsage = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setShowUsageLog(true);
  };

  const handleDelete = async () => {
    if (!deleteEquipment) return;
    
    try {
      await db.delete('equipment', deleteEquipment.id);
      toast({ title: "Success", description: "Equipment deleted successfully" });
      loadEquipment();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete equipment", variant: "destructive" });
    }
    setDeleteEquipment(null);
  };

  const handleMarkBroken = async (eq: Equipment) => {
    try {
      await db.update('equipment', { ...eq, condition: 'broken' });
      await db.add<BrokenItem>('brokenItems', {
        type: 'equipment',
        name: eq.name,
        quantity: eq.quantity,
        cause: 'Marked as broken',
        reportedBy: 'System',
        date: new Date().toISOString(),
        remarks: `Brand: ${eq.brand}, Location: ${eq.location}`,
      });
      await ReminderService.createBrokenItemReminder(eq.name, 'equipment');
      toast({ title: "Success", description: "Equipment marked as broken" });
      loadEquipment();
    } catch (error) {
      toast({ title: "Error", description: "Failed to mark as broken", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Equipment Management</h2>
          <p className="text-muted-foreground">Manage your laboratory equipment inventory</p>
        </div>
        <Button className="gap-2" onClick={() => {
          setSelectedEquipment(undefined);
          setShowForm(true);
        }}>
          <Plus className="h-4 w-4" />
          Add Equipment
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Brand/Model</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEquipment.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No equipment found. Add your first equipment to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredEquipment.map((eq) => (
                <TableRow key={eq.id}>
                  <TableCell className="font-medium">{eq.name}</TableCell>
                  <TableCell>{eq.brand}</TableCell>
                  <TableCell>{eq.quantity}</TableCell>
                  <TableCell>{eq.location}</TableCell>
                  <TableCell>{new Date(eq.purchaseDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {eq.condition === 'normal' ? (
                      <Badge variant="default">Normal</Badge>
                    ) : (
                      <Badge variant="destructive">Broken</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {eq.condition !== 'broken' && (
                        <>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => handleLogUsage(eq)}
                            title="Log Usage"
                          >
                            <Activity className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => handleMarkBroken(eq)}
                            title="Mark as Broken"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => handleEdit(eq)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => setDeleteEquipment(eq)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EquipmentForm
        open={showForm}
        onOpenChange={setShowForm}
        equipment={selectedEquipment}
        onSuccess={loadEquipment}
      />

      {selectedEquipment && (
        <UsageLogForm
          open={showUsageLog}
          onOpenChange={setShowUsageLog}
          item={selectedEquipment}
          itemType="equipment"
          onSuccess={loadEquipment}
        />
      )}

      <AlertDialog open={!!deleteEquipment} onOpenChange={() => setDeleteEquipment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Equipment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteEquipment?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
