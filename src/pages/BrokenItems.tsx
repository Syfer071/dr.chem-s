import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Trash2, RotateCcw, Plus } from "lucide-react";
import { db, BrokenItem, Chemical, Equipment } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BrokenItemForm } from "@/components/BrokenItemForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export default function BrokenItems() {
  const [brokenItems, setBrokenItems] = useState<BrokenItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBrokenItems();
  }, []);

  const loadBrokenItems = async () => {
    const data = await db.getAll<BrokenItem>('brokenItems');
    setBrokenItems(data);
  };

  const filteredItems = brokenItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    try {
      await db.delete('brokenItems', id);
      toast({ title: "Success", description: "Broken item record deleted" });
      loadBrokenItems();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete record", variant: "destructive" });
    }
  };

  const handleRestore = async (item: BrokenItem) => {
    try {
      // Find and restore the original item
      if (item.type === 'chemical') {
        const chemicals = await db.getAll<Chemical>('chemicals');
        const original = chemicals.find(c => c.name === item.name);
        if (original) {
          await db.update('chemicals', { ...original, condition: 'normal' });
        }
      } else {
        const equipment = await db.getAll<Equipment>('equipment');
        const original = equipment.find(e => e.name === item.name);
        if (original) {
          await db.update('equipment', { ...original, condition: 'normal' });
        }
      }
      
      // Delete from broken items
      await db.delete('brokenItems', item.id);
      toast({ title: "Success", description: "Item restored to active inventory" });
      loadBrokenItems();
    } catch (error) {
      toast({ title: "Error", description: "Failed to restore item", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Broken / Damaged Items</h2>
          <p className="text-muted-foreground">Track and manage damaged laboratory items</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Broken Item
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search broken items..."
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
              <TableHead>Item Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Cause</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No broken or damaged items recorded.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant={item.type === 'chemical' ? 'default' : 'secondary'}>
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.cause}</TableCell>
                  <TableCell>{item.reportedBy}</TableCell>
                  <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => handleRestore(item)}
                        title="Restore to Active"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
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

      <BrokenItemForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={loadBrokenItems}
      />
    </div>
  );
}
