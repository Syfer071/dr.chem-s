import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit, Trash2, Activity, AlertTriangle } from "lucide-react";
import { db, Chemical, BrokenItem } from "@/lib/db";
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
import { ChemicalForm } from "@/components/ChemicalForm";
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

export default function Chemicals() {
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showUsageLog, setShowUsageLog] = useState(false);
  const [selectedChemical, setSelectedChemical] = useState<Chemical | undefined>();
  const [deleteChemical, setDeleteChemical] = useState<Chemical | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadChemicals();
  }, []);

  const loadChemicals = async () => {
    const data = await db.getAll<Chemical>('chemicals');
    setChemicals(data);
  };

  const filteredChemicals = chemicals.filter(chem =>
    chem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chem.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getConditionBadge = (condition: string, chemical: Chemical) => {
    const isLowStock = chemical.quantity <= chemical.minLimit;
    const isExpiring = new Date(chemical.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    return (
      <div className="flex gap-1">
        {condition === 'normal' && <Badge variant="default">Normal</Badge>}
        {condition === 'used' && <Badge variant="secondary">Used</Badge>}
        {condition === 'broken' && <Badge variant="destructive">Broken</Badge>}
        {isLowStock && condition !== 'broken' && <Badge variant="destructive">Low Stock</Badge>}
        {isExpiring && condition !== 'broken' && <Badge variant="destructive">Expiring</Badge>}
      </div>
    );
  };

  const handleEdit = (chemical: Chemical) => {
    setSelectedChemical(chemical);
    setShowForm(true);
  };

  const handleLogUsage = (chemical: Chemical) => {
    setSelectedChemical(chemical);
    setShowUsageLog(true);
  };

  const handleDelete = async () => {
    if (!deleteChemical) return;
    
    try {
      await db.delete('chemicals', deleteChemical.id);
      toast({ title: "Success", description: "Chemical deleted successfully" });
      loadChemicals();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete chemical", variant: "destructive" });
    }
    setDeleteChemical(null);
  };

  const handleMarkBroken = async (chemical: Chemical) => {
    try {
      await db.update('chemicals', { ...chemical, condition: 'broken' });
      await db.add<BrokenItem>('brokenItems', {
        type: 'chemical',
        name: chemical.name,
        quantity: chemical.quantity,
        cause: 'Marked as broken',
        reportedBy: 'System',
        date: new Date().toISOString(),
        remarks: `Brand: ${chemical.brand}, Location: ${chemical.location}`,
      });
      await ReminderService.createBrokenItemReminder(chemical.name, 'chemical');
      toast({ title: "Success", description: "Chemical marked as broken" });
      loadChemicals();
    } catch (error) {
      toast({ title: "Error", description: "Failed to mark as broken", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Chemical Management</h2>
          <p className="text-muted-foreground">Manage your laboratory chemicals inventory</p>
        </div>
        <Button className="gap-2" onClick={() => {
          setSelectedChemical(undefined);
          setShowForm(true);
        }}>
          <Plus className="h-4 w-4" />
          Add Chemical
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chemicals..."
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
              <TableHead>Brand</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredChemicals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No chemicals found. Add your first chemical to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredChemicals.map((chemical) => (
                <TableRow key={chemical.id}>
                  <TableCell className="font-medium">{chemical.name}</TableCell>
                  <TableCell>{chemical.brand}</TableCell>
                  <TableCell>
                    {chemical.quantity} {chemical.unit}
                  </TableCell>
                  <TableCell>{chemical.location}</TableCell>
                  <TableCell>{new Date(chemical.expiryDate).toLocaleDateString()}</TableCell>
                  <TableCell>{getConditionBadge(chemical.condition, chemical)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {chemical.condition !== 'broken' && (
                        <>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => handleLogUsage(chemical)}
                            title="Log Usage"
                          >
                            <Activity className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => handleMarkBroken(chemical)}
                            title="Mark as Broken"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => handleEdit(chemical)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => setDeleteChemical(chemical)}
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

      <ChemicalForm
        open={showForm}
        onOpenChange={setShowForm}
        chemical={selectedChemical}
        onSuccess={loadChemicals}
      />

      {selectedChemical && (
        <UsageLogForm
          open={showUsageLog}
          onOpenChange={setShowUsageLog}
          item={selectedChemical}
          itemType="chemical"
          onSuccess={loadChemicals}
        />
      )}

      <AlertDialog open={!!deleteChemical} onOpenChange={() => setDeleteChemical(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chemical</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteChemical?.name}"? This action cannot be undone.
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
