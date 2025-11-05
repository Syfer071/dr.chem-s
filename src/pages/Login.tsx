import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { FlaskConical } from "lucide-react";
import { db, User } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    await db.init();
    const users = await db.getAll<User>('users');
    setIsFirstTime(users.length === 0);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isFirstTime) {
      // Create new user
      if (!formData.name || !formData.email || !formData.password) {
        toast({
          title: "Error",
          description: "Please fill in all fields",
          variant: "destructive",
        });
        return;
      }

      const userId = await db.add<User>('users', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      const user = await db.get<User>('users', userId);
      if (user) {
        onLogin(user);
        toast({
          title: "Welcome!",
          description: "Your account has been created successfully",
        });
      }
    } else {
      // Login existing user
      const users = await db.getAll<User>('users');
      const user = users.find(u => u.password === formData.password);
      
      if (user) {
        onLogin(user);
        toast({
          title: "Welcome back!",
          description: `Logged in as ${user.name}`,
        });
      } else {
        toast({
          title: "Error",
          description: "Invalid password",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md p-8 shadow-card-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <FlaskConical className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">DR.CHEM'S</h1>
          <p className="text-sm text-muted-foreground">
            Laboratory Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isFirstTime && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
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
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full">
            {isFirstTime ? 'Create Account' : 'Login'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
