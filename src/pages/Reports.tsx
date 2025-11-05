import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download, FileText } from "lucide-react";
import { db, Chemical, Equipment, BrokenItem, UsageLog } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Reports() {
  const [reportType, setReportType] = useState('general');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const { toast } = useToast();

  const generateReport = async () => {
    try {
      const chemicals = await db.getAll<Chemical>('chemicals');
      const equipment = await db.getAll<Equipment>('equipment');
      const brokenItems = await db.getAll<BrokenItem>('brokenItems');
      const usageLogs = await db.getAll<UsageLog>('usageLogs');

      // Filter by date range
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      const filteredLogs = usageLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= startDate && logDate <= endDate;
      });

      const filteredBroken = brokenItems.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
      });

      // Generate CSV based on report type
      let csv = '';
      let filename = '';

      switch (reportType) {
        case 'general':
          csv = generateGeneralReport(chemicals, equipment, brokenItems, filteredLogs);
          filename = 'general-report';
          break;
        case 'monthly':
          csv = generateMonthlyReport(filteredLogs, filteredBroken);
          filename = 'monthly-report';
          break;
        case 'yearly':
          csv = generateYearlyReport(filteredLogs, filteredBroken);
          filename = 'yearly-report';
          break;
        case 'custom':
          csv = generateCustomReport(chemicals, equipment, filteredLogs, filteredBroken);
          filename = `report-${dateRange.start}-to-${dateRange.end}`;
          break;
      }

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      toast({ title: "Success", description: "Report generated and downloaded" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate report", variant: "destructive" });
    }
  };

  const generateGeneralReport = (
    chemicals: Chemical[], 
    equipment: Equipment[], 
    brokenItems: BrokenItem[],
    usageLogs: UsageLog[]
  ) => {
    const expiringSoon = chemicals.filter(c => {
      const expiryDate = new Date(c.expiryDate);
      const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      return expiryDate <= thirtyDays;
    });

    const lowStock = chemicals.filter(c => c.quantity <= c.minLimit);

    return [
      'GENERAL LAB INVENTORY REPORT',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'SUMMARY',
      `Total Chemicals,${chemicals.length}`,
      `Total Equipment,${equipment.length}`,
      `Low Stock Items,${lowStock.length}`,
      `Expiring Soon (30 days),${expiringSoon.length}`,
      `Broken/Damaged Items,${brokenItems.length}`,
      `Total Usage Logs,${usageLogs.length}`,
      '',
      'LOW STOCK CHEMICALS',
      'Name,Brand,Current Quantity,Min Limit,Location',
      ...lowStock.map(c => `"${c.name}","${c.brand}",${c.quantity}${c.unit},${c.minLimit}${c.unit},"${c.location}"`),
      '',
      'EXPIRING SOON',
      'Name,Brand,Expiry Date,Days Remaining',
      ...expiringSoon.map(c => {
        const days = Math.ceil((new Date(c.expiryDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        return `"${c.name}","${c.brand}",${c.expiryDate},${days}`;
      }),
    ].join('\n');
  };

  const generateMonthlyReport = (usageLogs: UsageLog[], brokenItems: BrokenItem[]) => {
    return [
      'MONTHLY LAB ACTIVITY REPORT',
      `Period: ${dateRange.start} to ${dateRange.end}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'USAGE SUMMARY',
      'Date,Item Name,Type,Quantity Used,Used By,Purpose',
      ...usageLogs.map(log => 
        `${log.date},"${log.itemName}","${log.itemType}",${log.quantityUsed},"${log.usedBy}","${log.purpose}"`
      ),
      '',
      'DAMAGED ITEMS',
      'Date,Item Name,Type,Quantity,Cause,Reported By',
      ...brokenItems.map(item =>
        `${item.date},"${item.name}","${item.type}",${item.quantity},"${item.cause}","${item.reportedBy}"`
      ),
    ].join('\n');
  };

  const generateYearlyReport = (usageLogs: UsageLog[], brokenItems: BrokenItem[]) => {
    const chemicalUsage = usageLogs.filter(l => l.itemType === 'chemical');
    const equipmentUsage = usageLogs.filter(l => l.itemType === 'equipment');

    return [
      'YEARLY LAB REPORT',
      `Period: ${dateRange.start} to ${dateRange.end}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'STATISTICS',
      `Total Usage Logs,${usageLogs.length}`,
      `Chemical Usage Logs,${chemicalUsage.length}`,
      `Equipment Usage Logs,${equipmentUsage.length}`,
      `Damaged Items Reported,${brokenItems.length}`,
      '',
      'DETAILED USAGE',
      'Date,Item Name,Type,Quantity Used,Used By',
      ...usageLogs.map(log => 
        `${log.date},"${log.itemName}","${log.itemType}",${log.quantityUsed},"${log.usedBy}"`
      ),
    ].join('\n');
  };

  const generateCustomReport = (
    chemicals: Chemical[],
    equipment: Equipment[],
    usageLogs: UsageLog[],
    brokenItems: BrokenItem[]
  ) => {
    return [
      'CUSTOM DATE RANGE REPORT',
      `Period: ${dateRange.start} to ${dateRange.end}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'CURRENT INVENTORY',
      'CHEMICALS',
      'Name,Brand,Quantity,Location,Condition',
      ...chemicals.map(c => `"${c.name}","${c.brand}",${c.quantity}${c.unit},"${c.location}","${c.condition}"`),
      '',
      'EQUIPMENT',
      'Name,Brand,Quantity,Location,Condition',
      ...equipment.map(e => `"${e.name}","${e.brand}",${e.quantity},"${e.location}","${e.condition}"`),
      '',
      'USAGE DURING PERIOD',
      'Date,Item Name,Type,Quantity Used,Used By,Purpose',
      ...usageLogs.map(log => 
        `${log.date},"${log.itemName}","${log.itemType}",${log.quantityUsed},"${log.usedBy}","${log.purpose}"`
      ),
      '',
      'DAMAGED ITEMS DURING PERIOD',
      'Date,Item Name,Type,Quantity,Cause,Reported By',
      ...brokenItems.map(item =>
        `${item.date},"${item.name}","${item.type}",${item.quantity},"${item.cause}","${item.reportedBy}"`
      ),
    ].join('\n');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold">Reports & Export</h2>
        <p className="text-muted-foreground">Generate and export lab inventory reports</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Report</SelectItem>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                  <SelectItem value="yearly">Yearly Report</SelectItem>
                  <SelectItem value="custom">Custom Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(reportType === 'custom' || reportType === 'monthly' || reportType === 'yearly') && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  />
                </div>
              </>
            )}

            <Button className="w-full gap-2" onClick={generateReport}>
              <Download className="h-4 w-4" />
              Generate & Download Report
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Information
          </h3>
          <div className="space-y-3 text-sm">
            {reportType === 'general' && (
              <div>
                <p className="font-medium">General Report includes:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
                  <li>Total chemicals and equipment count</li>
                  <li>Low stock items</li>
                  <li>Items expiring within 30 days</li>
                  <li>Broken/damaged items summary</li>
                  <li>Overall inventory status</li>
                </ul>
              </div>
            )}
            {reportType === 'monthly' && (
              <div>
                <p className="font-medium">Monthly Report includes:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
                  <li>All usage logs for the selected period</li>
                  <li>Chemicals consumed</li>
                  <li>Equipment usage records</li>
                  <li>Damaged items during the month</li>
                </ul>
              </div>
            )}
            {reportType === 'yearly' && (
              <div>
                <p className="font-medium">Yearly Report includes:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
                  <li>Complete usage statistics</li>
                  <li>Chemical and equipment trends</li>
                  <li>Annual damage report</li>
                  <li>Yearly consumption analysis</li>
                </ul>
              </div>
            )}
            {reportType === 'custom' && (
              <div>
                <p className="font-medium">Custom Report includes:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
                  <li>Current inventory snapshot</li>
                  <li>Usage logs for selected dates</li>
                  <li>Damaged items during period</li>
                  <li>Complete activity summary</li>
                </ul>
              </div>
            )}
            <p className="text-xs text-muted-foreground pt-3 border-t">
              Reports are exported in CSV format for easy viewing in Excel or Google Sheets
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
