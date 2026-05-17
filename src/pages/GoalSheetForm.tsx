import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, addDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { THRUST_AREAS, UOM_TYPES } from '@/lib/constants';
import { toast } from 'sonner';
import { Plus, Trash2, Send, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Goal, GoalSheet, GoalCycle } from '../types';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const GoalSheetForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeCycle, setActiveCycle] = useState<GoalCycle | null>(null);
  const [sheet, setSheet] = useState<GoalSheet | null>(null);
  const [goals, setGoals] = useState<Partial<Goal>[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cycleSnap = await getDocs(query(collection(db, 'cycles'), where('isActive', '==', true)));
        if (cycleSnap.empty) {
          toast.error('No active goal cycle found.');
          return;
        }
        const cycleData = { id: cycleSnap.docs[0].id, ...cycleSnap.docs[0].data() } as GoalCycle;
        setActiveCycle(cycleData);

        const sheetSnap = await getDocs(query(
          collection(db, 'goalSheets'),
          where('employeeId', '==', user?.uid),
          where('cycleId', '==', cycleData.id)
        ));

        if (!sheetSnap.empty) {
          const sheetData = { id: sheetSnap.docs[0].id, ...sheetSnap.docs[0].data() } as GoalSheet;
          setSheet(sheetData);
          
          const goalsSnap = await getDocs(collection(db, 'goalSheets', sheetData.id, 'goals'));
          setGoals(goalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal)));
        } else {
          // Initialize empty sheet structure
          setGoals([{ tempId: Date.now(), thrustArea: '', title: '', description: '', uomType: 'numeric_min', targetValue: '', weightage: 20 }]);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load goal data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const addGoal = () => {
    if (goals.length >= 8) {
      toast.error('Maximum 8 goals allowed.');
      return;
    }
    setGoals([...goals, { tempId: Date.now(), thrustArea: '', title: '', description: '', uomType: 'numeric_min', targetValue: '', weightage: 0 }]);
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const updateGoal = (index: number, field: keyof Goal, value: any) => {
    const newGoals = [...goals];
    newGoals[index] = { ...newGoals[index], [field]: value };
    setGoals(newGoals);
  };

  const totalWeightage = goals.reduce((sum, g) => sum + (Number(g.weightage) || 0), 0);

  const handleSubmit = async (submitForApproval: boolean) => {
    if (!activeCycle || !user) return;
    setSubmitting(true);

    try {
      // 1. Backend Validation Call
      const valResponse = await fetch('/api/goals/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals })
      });

      if (!valResponse.ok && submitForApproval) {
        const { errors } = await valResponse.json();
        errors.forEach((err: string) => toast.error(err));
        setSubmitting(false);
        return;
      }

      // 2. Persistence
      const batch = writeBatch(db);
      let sheetId = sheet?.id;

      if (!sheetId) {
        const sheetRef = doc(collection(db, 'goalSheets'));
        sheetId = sheetRef.id;
        batch.set(sheetRef, {
          employeeId: user.uid,
          cycleId: activeCycle.id,
          status: submitForApproval ? 'submitted' : 'draft',
          submittedAt: submitForApproval ? new Date().toISOString() : null,
        });
      } else {
        batch.update(doc(db, 'goalSheets', sheetId), {
          status: submitForApproval ? 'submitted' : 'draft',
          submittedAt: submitForApproval ? new Date().toISOString() : null,
        });
      }

      // Delete old goals and write new ones (Simplified for demo)
      // In a real app we'd diff them
      const goalsCol = collection(db, 'goalSheets', sheetId, 'goals');
      const oldGoals = await getDocs(goalsCol);
      oldGoals.forEach(d => batch.delete(d.ref));

      goals.forEach(g => {
        const goalRef = doc(goalsCol);
        const { tempId, id, ...goalData } = g as any;
        batch.set(goalRef, { ...goalData, createdAt: new Date().toISOString() });
      });

      await batch.commit();
      toast.success(submitForApproval ? 'Goal sheet submitted for approval!' : 'Draft saved successfully.');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save goals.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading goal sheet...</div>;

  const isLocked = sheet?.status === 'approved' || sheet?.status === 'submitted';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Define Your Goals</h2>
          <p className="text-slate-500">Plan your objectives for {activeCycle?.name}</p>
        </div>
        <div className={cn(
          "px-4 py-2 rounded-lg border font-bold flex flex-col items-center",
          totalWeightage === 100 ? "bg-green-50 border-green-200 text-green-700" : "bg-orange-50 border-orange-200 text-orange-700"
        )}>
          <span className="text-xs uppercase tracking-wider opacity-70">Total Weightage</span>
          <span className="text-2xl">{totalWeightage}%</span>
        </div>
      </div>

      {isLocked && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold">Goal Sheet is Locked</p>
            <p>Your goals are currently {sheet?.status}. You cannot make changes unless your manager returns it for rework or HR unlocks it.</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {goals.map((goal, index) => (
            <motion.div
              key={(goal as any).id || (goal as any).tempId || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="relative overflow-hidden group">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-slate-400">Goal #{index + 1}</Badge>
                    <Input 
                      placeholder="Goal Title" 
                      className="border-none text-lg font-bold p-0 focus-visible:ring-0 w-full md:w-96"
                      value={goal.title}
                      onChange={(e) => updateGoal(index, 'title', e.target.value)}
                      disabled={isLocked}
                    />
                  </div>
                  {!isLocked && (
                    <Button variant="ghost" size="sm" onClick={() => removeGoal(index)} className="text-slate-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Thrust Area</Label>
                      <Select 
                        value={goal.thrustArea} 
                        onValueChange={(v) => updateGoal(index, 'thrustArea', v)}
                        disabled={isLocked}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select Area" />
                        </SelectTrigger>
                        <SelectContent>
                          {THRUST_AREAS.map(area => (
                            <SelectItem key={area} value={area}>{area}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Description</Label>
                      <Textarea 
                        placeholder="Expected outcome..." 
                        rows={2}
                        className="resize-none"
                        value={goal.description}
                        onChange={(e) => updateGoal(index, 'description', e.target.value)}
                        disabled={isLocked}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">UoM Type</Label>
                        <Select 
                          value={goal.uomType} 
                          onValueChange={(v) => updateGoal(index, 'uomType', v)}
                          disabled={isLocked}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UOM_TYPES.map(uom => (
                              <SelectItem key={uom.id} value={uom.id}>{uom.label.split('-')[0]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Target Value</Label>
                        <Input 
                          placeholder="e.g. 100" 
                          className="h-9"
                          value={goal.targetValue}
                          onChange={(e) => updateGoal(index, 'targetValue', e.target.value)}
                          disabled={isLocked}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Weightage (%)</Label>
                      <div className="flex items-center gap-4">
                        <Input 
                          type="number"
                          className="h-9 w-24"
                          value={goal.weightage}
                          onChange={(e) => updateGoal(index, 'weightage', parseInt(e.target.value))}
                          disabled={isLocked}
                        />
                        <div className="flex-1">
                          <div className={cn(
                            "h-1 rounded-full",
                            (goal.weightage || 0) < 10 ? "bg-red-200" : "bg-blue-200"
                          )}>
                             <div 
                               className="h-full bg-blue-600 rounded-full transition-all" 
                               style={{ width: `${Math.min(goal.weightage || 0, 100)}%` }}
                             />
                          </div>
                          {(goal.weightage || 0) < 10 && (
                            <p className="text-[10px] text-red-500 font-medium mt-1">Min 10% required</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!isLocked && (
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-6 border-t">
          <Button variant="outline" onClick={addGoal} disabled={goals.length >= 8}>
            <Plus className="w-4 h-4 mr-2" /> Add Goal
          </Button>
          
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => handleSubmit(false)} disabled={submitting}>
              <Save className="w-4 h-4 mr-2" /> Save Draft
            </Button>
            <Button onClick={() => handleSubmit(true)} disabled={submitting || totalWeightage !== 100} className="bg-blue-600">
              <Send className="w-4 h-4 mr-2" /> Submit for Approval
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalSheetForm;
