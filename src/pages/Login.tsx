import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DEMO_CREDENTIALS } from '../lib/constants';
import { toast } from 'sonner';
import { ShieldCheck, Target, Users, Loader2, Play } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const navigate = useNavigate();
  const { mockLogin } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Successfully logged in');
      navigate('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        toast.error('Email/Password provider is disabled in Firebase. Use Google Login or Demo Bypass.');
      } else {
        toast.error('Login failed: ' + (error.message || 'Unknown error'));
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMockLogin = async (role: any) => {
    await mockLogin(role);
    navigate('/dashboard');
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      // Check if user exists in Firestore, if not, they might need to be assigned a role
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        toast.info('Google account signed in, but no profile found. Please contact an admin or initialize demo data.');
        // In a real app, you might redirect to a 'profile setup' page
      } else {
        toast.success('Successfully logged in with Google');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error('Google login failed: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const seedDemoData = async () => {
    setInitializing(true);
    try {
      // 1. Create Users in Firestore
      const usersData = [
        { uid: 'admin-1', name: 'System Admin', email: 'admin@demo.com', role: 'admin', department: 'HR' },
        { uid: 'manager-1', name: 'John Manager', email: 'manager@demo.com', role: 'manager', department: 'Sales', managerId: 'admin-1' },
        { uid: 'employee-1', name: 'Alice Employee', email: 'employee@demo.com', role: 'employee', department: 'Sales', managerId: 'manager-1' },
        { uid: 'employee-2', name: 'Bob Employee', email: 'bob@demo.com', role: 'employee', department: 'Sales', managerId: 'manager-1' },
      ];

      for (const userData of usersData) {
        // Create Firestore doc first
        await setDoc(doc(db, 'users', userData.uid), {
          name: userData.name,
          email: userData.email,
          role: userData.role,
          department: userData.department,
          managerId: userData.managerId || null,
          createdAt: new Date().toISOString()
        });

        // Try to create auth user (will fail if provider disabled)
        try {
          await createUserWithEmailAndPassword(auth, userData.email, 'Demo@1234');
        } catch (e: any) {
          console.warn(`Auth creation skipped for ${userData.email}: ${e.message}`);
        }
      }

      // 2. Create an Active Cycle
      const cycleId = 'fy26-cycle';
      await setDoc(doc(db, 'cycles', cycleId), {
        name: 'FY 2026 Performance Cycle',
        phase: 'goal_setting',
        isActive: true,
        windowOpenDate: new Date('2026-05-01').toISOString(),
        windowCloseDate: new Date('2026-05-31').toISOString(),
      });

      toast.success('Database initialized! Use Google login or enable Email/Password in Firebase Console.');
    } catch (error: any) {
      toast.error('Initialization failed: ' + error.message);
      console.error(error);
    } finally {
      setInitializing(false);
    }
  };

  const quickFill = (role: keyof typeof DEMO_CREDENTIALS) => {
    const creds = DEMO_CREDENTIALS[role];
    setEmail(creds.email);
    setPassword(creds.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4">A</div>
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome to AtomQuest</CardTitle>
          <CardDescription>Login to your goal tracking portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Sign In
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or continue with</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={handleGoogleLogin} 
              disabled={loading}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-500 mb-4 text-center">Demo Quick Login (By-pass Auth)</p>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={() => handleMockLogin('employee')} className="text-xs group">
                <Target className="w-3 h-3 mr-1 group-hover:text-blue-600" /> Employee
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleMockLogin('manager')} className="text-xs group">
                <Users className="w-3 h-3 mr-1 group-hover:text-blue-600" /> Manager
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleMockLogin('admin')} className="text-xs group">
                <ShieldCheck className="w-3 h-3 mr-1 group-hover:text-blue-600" /> Admin
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Use these buttons to skip Firebase Auth setup and go straight to the app.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-slate-400 hover:text-blue-600"
            onClick={seedDemoData}
            disabled={initializing}
          >
            {initializing ? 'Initializing...' : 'Initialize Demo Data (First time only)'}
          </Button>
          <p className="text-xs text-slate-400 text-center">
            AtomQuest Performance Management System v1.0
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
