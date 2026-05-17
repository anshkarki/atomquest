import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Plus, 
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { GoalSheet, GoalCycle } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeCycle, setActiveCycle] = useState<GoalCycle | null>(null);
  const [mySheet, setMySheet] = useState<GoalSheet | null>(null);
  const [teamStats, setTeamStats] = useState({ total: 0, submitted: 0, approved: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Active Cycle
        const cycleSnap = await getDocs(query(collection(db, 'cycles'), where('isActive', '==', true)));
        if (!cycleSnap.empty) {
          const cycleData = { id: cycleSnap.docs[0].id, ...cycleSnap.docs[0].data() } as GoalCycle;
          setActiveCycle(cycleData);

          // Fetch My Sheet
          if (user?.role === 'employee') {
            const sheetSnap = await getDocs(query(
              collection(db, 'goalSheets'), 
              where('employeeId', '==', user.uid),
              where('cycleId', '==', cycleData.id)
            ));
            if (!sheetSnap.empty) {
              setMySheet({ id: sheetSnap.docs[0].id, ...sheetSnap.docs[0].data() } as GoalSheet);
            }
          }

          // Manager Stats
          if (user?.role === 'manager') {
            const reportsSnap = await getDocs(query(collection(db, 'users'), where('managerId', '==', user.uid)));
            const reports = reportsSnap.docs.map(doc => doc.id);
            setTeamStats(prev => ({ ...prev, total: reports.length }));

            if (reports.length > 0) {
              const sheetsSnap = await getDocs(query(
                collection(db, 'goalSheets'),
                where('cycleId', '==', cycleData.id),
                where('employeeId', 'in', reports)
              ));
              const sheets = sheetsSnap.docs.map(doc => doc.data() as GoalSheet);
              setTeamStats(prev => ({
                ...prev,
                submitted: sheets.filter(s => s.status === 'submitted').length,
                approved: sheets.filter(s => s.status === 'approved').length
              }));
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Approved</Badge>;
      case 'submitted': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Submitted</Badge>;
      case 'returned': return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Returned</Badge>;
      default: return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name.split(' ')[0]} 👋
          </h2>
          <p className="text-slate-500">
            {user?.role === 'employee' ? "Here's your goal progress for the current cycle." : "Here's an overview of your team's performance."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-white px-3 py-1">
            {user?.department}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cycle Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Active Goal Cycle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">{activeCycle?.name || 'Loading Cycle...'}</h3>
                <p className="text-sm text-slate-500">
                  Window: {activeCycle ? `${new Date(activeCycle.windowOpenDate).toLocaleDateString()} - ${new Date(activeCycle.windowCloseDate).toLocaleDateString()}` : '...'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-600 text-white capitalize p-2 px-4 text-xs font-semibold">
                  Phase: {activeCycle?.phase.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            
            <div className="mt-8 space-y-2">
              <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-slate-400">
                <span>Cycle Progress</span>
                <span>45% Complete</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Role Specific */}
        {user?.role === 'employee' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Your Goal Sheet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Status</span>
                <StatusBadge status={mySheet?.status || 'draft'} />
              </div>
              
              <div className="pt-4 space-y-2">
                {mySheet?.status === 'approved' ? (
                  <Button asChild className="w-full bg-blue-600">
                    <Link to="/goals/track">
                      Track Achievements <TrendingUp className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <Link to="/goals/new">
                      {mySheet ? 'Edit Goals' : 'Create Goals'} <Plus className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {user?.role === 'manager' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Team Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{teamStats.submitted}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-tighter">Pending Approvals</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-2xl font-bold">{teamStats.approved}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-tighter">Approved Team</p>
                </div>
              </div>
              
              <Button asChild variant="outline" className="w-full">
                <Link to="/manager/approvals">
                  View Team Board <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Featured Metric / Status Grid */}
      <h3 className="text-lg font-bold text-slate-900 mt-8">Recent Notifications</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2].map((i) => (
          <Card key={i} className="hover:border-blue-200 transition-colors cursor-pointer group">
            <CardContent className="p-4 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Quarterly Check-In Reminder</p>
                <p className="text-xs text-slate-500">The window for Q1 achievements is now open until June 15th.</p>
                <div className="flex items-center text-xs text-blue-600 font-medium mt-2 group-hover:gap-1 transition-all">
                  Take action <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
