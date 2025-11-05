import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Download } from "lucide-react";
import { db, UsageLog } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export default function UsageLogs() {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const data = await db.getAll<UsageLog>('usageLogs');
    setLogs(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const filteredLogs = logs.filter(log =>
    log.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.usedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ['Date', 'Item Name', 'Type', 'Quantity Used', 'Used By', 'Purpose'];
    const rows = filteredLogs.map(log => [
      new Date(log.date).toLocaleDateString(),
      log.itemName,
      log.itemType,
      log.quantityUsed,
      log.usedBy,
      log.purpose,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast({ title: "Success", description: "Usage logs exported successfully" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Usage Logs</h2>
          <p className="text-muted-foreground">Complete history of chemical and equipment usage</p>
        </div>
        <Button className="gap-2" onClick={handleExportCSV}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
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
              <TableHead>Date</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity Used</TableHead>
              <TableHead>Used By</TableHead>
              <TableHead>Purpose</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No usage logs found. Start logging chemical and equipment usage.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{log.itemName}</TableCell>
                  <TableCell>
                    <Badge variant={log.itemType === 'chemical' ? 'default' : 'secondary'}>
                      {log.itemType}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.quantityUsed}</TableCell>
                  <TableCell>{log.usedBy}</TableCell>
                  <TableCell className="max-w-xs truncate">{log.purpose}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
