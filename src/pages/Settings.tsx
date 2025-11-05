import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Download, Upload, Save, User, Moon, Sun } from "lucide-react";
import { db, User as UserType } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/useTheme";

interface SettingsProps {
  user: UserType;
  onUpdate: (user: UserType) => void;
}

export default function Settings({ user, onUpdate }: SettingsProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    password: '',
    confirmPassword: '',
  });
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    try {
      const updatedUser = {
        ...user,
        name: formData.name,
        email: formData.email,
        ...(formData.password ? { password: formData.password } : {}),
      };

      await db.update('users', updatedUser);
      onUpdate(updatedUser);
      toast({ title: "Success", description: "Profile updated successfully" });
      setFormData({ ...formData, password: '', confirmPassword: '' });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
  };

  const handleExportDatabase = async () => {
    try {
      const data = {
        users: await db.getAll('users'),
        chemicals: await db.getAll('chemicals'),
        equipment: await db.getAll('equipment'),
        brokenItems: await db.getAll('brokenItems'),
        usageLogs: await db.getAll('usageLogs'),
        reminders: await db.getAll('reminders'),
        schedule: await db.getAll('schedule'),
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dr-chems-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      toast({ title: "Success", description: "Database exported successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to export database", variant: "destructive" });
    }
  };

  const handleImportDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Clear existing data
      await db.clear('chemicals');
      await db.clear('equipment');
      await db.clear('brokenItems');
      await db.clear('usageLogs');
      await db.clear('reminders');
      await db.clear('schedule');

      // Import new data
      for (const item of data.chemicals || []) {
        const { id, ...rest } = item;
        await db.add('chemicals', rest);
      }
      for (const item of data.equipment || []) {
        const { id, ...rest } = item;
        await db.add('equipment', rest);
      }
      for (const item of data.brokenItems || []) {
        const { id, ...rest } = item;
        await db.add('brokenItems', rest);
      }
      for (const item of data.usageLogs || []) {
        const { id, ...rest } = item;
        await db.add('usageLogs', rest);
      }
      for (const item of data.reminders || []) {
        const { id, ...rest } = item;
        await db.add('reminders', rest);
      }
      for (const item of data.schedule || []) {
        const { id, ...rest } = item;
        await db.add('schedule', rest);
      }

      toast({ title: "Success", description: "Database imported successfully. Please refresh the page." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to import database", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Manage your profile and application settings</p>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          {theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          Appearance
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark mode
              </p>
            </div>
            <Button onClick={toggleTheme} variant="outline" size="sm" className="gap-2">
              {theme === 'light' ? (
                <>
                  <Moon className="h-4 w-4" />
                  Dark Mode
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4" />
                  Light Mode
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Settings
        </h3>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <p className="text-sm font-medium mb-4">Change Password (optional)</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave blank to keep current"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="gap-2">
            <Save className="h-4 w-4" />
            Update Profile
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Backup & Restore</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Export all your data as a JSON file for backup or migration purposes.
            </p>
            <Button onClick={handleExportDatabase} className="gap-2">
              <Download className="h-4 w-4" />
              Export Database
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3">
              Import a previously exported database. This will replace all current data.
            </p>
            <label htmlFor="import-file">
              <Button type="button" variant="outline" className="gap-2" onClick={() => document.getElementById('import-file')?.click()}>
                <Upload className="h-4 w-4" />
                Import Database
              </Button>
            </label>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleImportDatabase}
              className="hidden"
            />
          </div>

          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 text-sm">
            <p className="font-medium text-warning mb-1">⚠️ Important</p>
            <p className="text-muted-foreground">
              Importing a database will permanently delete all current data. Make sure to export your current database before importing.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
