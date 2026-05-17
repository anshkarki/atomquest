import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Eye, Loader2, ArrowLeft } from 'lucide-react';
import { Goal, GoalSheet, User } from '../types';
import { cn } from '@/lib/utils';

const ApprovalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<User[]>([]);
  const [sheets, setSheets] = useState<{ [employeeId: string]: GoalSheet }>({});
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [selectedSheetGoals, setSelectedSheetGoals] = useState<Goal[]>([]);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [returnComment, setReturnComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const reportsSnap = await getDocs(query(collection(db, 'users'), where('managerId', '==', user?.uid)));
        const reportsList = reportsSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
        setReports(reportsList);

        if (reportsList.length > 0) {
          const sheetsSnap = await getDocs(query(
            collection(db, 'goalSheets'),
            where('employeeId', 'in', reportsList.map(r => r.uid))
          ));
          const sheetsMap: { [employeeId: string]: GoalSheet } = {};
          sheetsSnap.forEach(doc => {
            const data = doc.data() as GoalSheet;
            sheetsMap[data.employeeId] = { id: doc.id, ...data };
          });
          setSheets(sheetsMap);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [user]);

  const openReview = async (employee: User) => {
    const sheet = sheets[employee.uid];
    if (!sheet) return;

    setSelectedEmployee(employee);
    const goalsSnap = await getDocs(collection(db, 'goalSheets', sheet.id, 'goals'));
    setSelectedSheetGoals(goalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal)));
    setReviewDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedEmployee || !user) return;
    setActionLoading(true);
    const sheetId = sheets[selectedEmployee.uid].id;

    try {
      // 1. Update goals in case the manager edited them (omitted inline edit for brevity in this step, but standard update can go here)
      // 2. Update sheet status
      await updateDoc(doc(db, 'goalSheets', sheetId), {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: user.uid
      });

      // 3. Log Audit
      await addDoc(collection(db, 'auditLogs'), {
        entityType: 'goalSheet',
        entityId: sheetId,
        changedBy: user.uid,
        changeDescription: 'Manager approved the goal sheet',
        changedAt: new Date().toISOString()
      });

      // Update local state
      setSheets(prev => ({ 
        ...prev, 
        [selectedEmployee.uid]: { ...prev[selectedEmployee.uid], status: 'approved' } 
      }));
      
      toast.success(`Goal sheet for ${selectedEmployee.name} approved.`);
      setReviewDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Approval failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!selectedEmployee || !user || !returnComment) {
      toast.error('Return comment is mandatory.');
      return;
    }
    setActionLoading(true);
    const sheetId = sheets[selectedEmployee.uid].id;

    try {
      await updateDoc(doc(db, 'goalSheets', sheetId), {
        status: 'returned',
      });

      await addDoc(collection(db, 'goalSheets', sheetId, 'comments'), {
        managerId: user.uid,
        comment: returnComment,
        phase: 'goal_setting',
        createdAt: new Date().toISOString()
      });

      setSheets(prev => ({ 
        ...prev, 
        [selectedEmployee.uid]: { ...prev[selectedEmployee.uid], status: 'returned' } 
      }));

      toast.success('Sheet returned for rework.');
      setReviewDialogOpen(false);
      setReturnComment('');
    } catch (err) {
      console.error(err);
      toast.error('Operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div>Loading team data...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Progress Dashboard</CardTitle>
          <CardDescription>Review and manage goal settings for your direct reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => {
                const sheet = sheets[report.uid];
                return (
                  <TableRow key={report.uid}>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell>{report.department}</TableCell>
                    <TableCell>
                      {sheet ? (
                         <Badge className={cn(
                           sheet.status === 'approved' ? 'bg-green-100 text-green-700' :
                           sheet.status === 'submitted' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                           'bg-slate-100 text-slate-700'
                         )}>
                          {sheet.status}
                         </Badge>
                      ) : (
                        <Badge variant="outline">Not Started</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {sheet?.submittedAt ? new Date(sheet.submittedAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {sheet?.status === 'submitted' ? (
                        <Button size="sm" onClick={() => openReview(report)} className="bg-blue-600">
                          Review <Eye className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => openReview(report)} disabled={!sheet}>
                          View
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Review Goal Sheet: {selectedEmployee?.name}</DialogTitle>
            <DialogDescription>
              Check the alignment and targets for FY26 Cycle. You can return for rework or approve as is.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            {selectedSheetGoals.map((goal, idx) => (
              <div key={goal.id} className="p-4 border rounded-lg bg-slate-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-900">{idx + 1}. {goal.title}</h4>
                  <Badge variant="secondary">{goal.weightage}%</Badge>
                </div>
                <p className="text-sm text-slate-600 mb-3">{goal.description}</p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div><span className="font-semibold text-slate-400">THRUST:</span> {goal.thrustArea}</div>
                  <div><span className="font-semibold text-slate-400">TARGET:</span> {goal.targetValue} ({goal.uomType})</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t space-y-4">
            <Label>Management Comments (Required for Return)</Label>
            <Textarea 
              placeholder="Provide feedback to the employee..." 
              value={returnComment}
              onChange={(e) => setReturnComment(e.target.value)}
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleReturn} 
              disabled={actionLoading || !returnComment}
            >
              <XCircle className="w-4 h-4 mr-2" /> Return for Rework
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Approve Goal Sheet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalDashboard;
