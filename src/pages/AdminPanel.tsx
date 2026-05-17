import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PHASES } from '../lib/constants';
import { GoalCycle, GoalSheet, User } from '../types';
import { toast } from 'sonner';
import { Download, Users, Calendar, Activity, Lock, Unlock } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const AdminPanel: React.FC = () => {
  const [cycles, setCycles] = useState<GoalCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allSheets, setAllSheets] = useState<GoalSheet[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const cycleSnap = await getDocs(collection(db, 'cycles'));
      setCycles(cycleSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as GoalCycle)));

      const usersSnap = await getDocs(collection(db, 'users'));
      setAllUsers(usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));

      const sheetsSnap = await getDocs(collection(db, 'goalSheets'));
      setAllSheets(sheetsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as GoalSheet)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCycleStatus = async (cycleId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'cycles', cycleId), { isActive: !currentStatus });
      toast.success('Cycle status updated.');
      fetchData();
    } catch (err) {
      toast.error('Update failed.');
    }
  };

  const unlockSheet = async (sheetId: string) => {
    try {
      await updateDoc(doc(db, 'goalSheets', sheetId), { status: 'draft' });
      toast.success('Goal sheet unlocked for editing.');
      fetchData();
    } catch (err) {
      toast.error('Unlock failed.');
    }
  };

  const exportData = (format: 'csv' | 'xlsx') => {
    const data = allSheets.map(s => {
      const u = allUsers.find(user => user.uid === s.employeeId);
      return {
        EmployeeName: u?.name,
        Department: u?.department,
        Status: s.status,
        SubmittedAt: s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : '-',
        ApprovedAt: s.approvedAt ? new Date(s.approvedAt).toLocaleDateString() : '-',
      };
    });

    if (format === 'csv') {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'atomquest_export.csv';
      link.click();
    } else {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, 'atomquest_export.xlsx');
    }
  };

  if (loading) return <div>Loading admin panel...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Governance & Control</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportData('xlsx')}>
            <Download className="w-4 h-4 mr-2" /> Export Excel
          </Button>
        </div>
      </div>

      <Tabs defaultValue="cycles" className="w-full">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="cycles"><Calendar className="w-4 h-4 mr-2" /> Goal Cycles</TabsTrigger>
          <TabsTrigger value="governance"><Lock className="w-4 h-4 mr-2" /> Goal Governance</TabsTrigger>
          <TabsTrigger value="users"><Users className="w-4 h-4 mr-2" /> User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="cycles" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cycle Configuration</CardTitle>
              <CardDescription>Configure window dates and phases for the organization.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cycle Name</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cycles.map(cycle => (
                    <TableRow key={cycle.id}>
                      <TableCell className="font-medium">{cycle.name}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{cycle.phase.replace('_', ' ')}</Badge></TableCell>
                      <TableCell>
                        <Badge className={cycle.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}>
                          {cycle.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => toggleCycleStatus(cycle.id, cycle.isActive)}>
                          {cycle.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="governance" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Goal Sheet Overrides</CardTitle>
              <CardDescription>Manually unlock or adjust goal sheets across the organization.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Current Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allSheets.map(sheet => {
                    const emp = allUsers.find(u => u.uid === sheet.employeeId);
                    return (
                      <TableRow key={sheet.id}>
                        <TableCell className="font-medium">{emp?.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{sheet.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {sheet.status !== 'draft' && (
                            <Button size="sm" variant="ghost" onClick={() => unlockSheet(sheet.id)} className="text-blue-600">
                              <Unlock className="w-3 h-3 mr-1" /> Unlock
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
