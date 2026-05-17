import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Goal, GoalSheet, GoalAchievement, GoalCycle } from '../types';
import { computeScore } from '../lib/scoring';
import { toast } from 'sonner';
import { Save, TrendingUp, CheckCircle2, Circle } from 'lucide-react';

const AchievementTracking: React.FC = () => {
  const { user } = useAuth();
  const [activeCycle, setActiveCycle] = useState<GoalCycle | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [achievements, setAchievements] = useState<{ [goalId: string]: Partial<GoalAchievement> }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cycleSnap = await getDocs(query(collection(db, 'cycles'), where('isActive', '==', true)));
        if (cycleSnap.empty) return;
        const cycle = { id: cycleSnap.docs[0].id, ...cycleSnap.docs[0].data() } as GoalCycle;
        setActiveCycle(cycle);

        const sheetSnap = await getDocs(query(
          collection(db, 'goalSheets'),
          where('employeeId', '==', user?.uid),
          where('cycleId', '==', cycle.id)
        ));

        if (!sheetSnap.empty) {
          const sheet = { id: sheetSnap.docs[0].id, ...sheetSnap.docs[0].data() } as GoalSheet;
          const goalsSnap = await getDocs(collection(db, 'goalSheets', sheet.id, 'goals'));
          const goalsList = goalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
          setGoals(goalsList);

          // Fetch existing achievements for current phase
          const achievementsMap: { [goalId: string]: Partial<GoalAchievement> } = {};
          for (const goal of goalsList) {
            const achSnap = await getDocs(query(
              collection(db, 'goals', goal.id, 'achievements'),
              where('cyclePhase', '==', cycle.phase)
            ));
            if (!achSnap.empty) {
              achievementsMap[goal.id] = { id: achSnap.docs[0].id, ...achSnap.docs[0].data() };
            } else {
              achievementsMap[goal.id] = { status: 'not_started', actualValue: '' };
            }
          }
          setAchievements(achievementsMap);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const updateAchievement = (goalId: string, field: keyof GoalAchievement, value: any) => {
    setAchievements(prev => ({
      ...prev,
      [goalId]: { ...prev[goalId], [field]: value }
    }));
  };

  const handleSave = async () => {
    if (!activeCycle) return;
    setSaving(true);
    try {
      for (const goalId of Object.keys(achievements)) {
        const ach = achievements[goalId];
        const achRef = ach.id 
          ? doc(db, 'goals', goalId, 'achievements', ach.id)
          : doc(collection(db, 'goals', goalId, 'achievements'));
        
        await setDoc(achRef, {
          ...ach,
          goalId,
          cyclePhase: activeCycle.phase,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      toast.success('Achievements updated successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save achievements.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading achievements...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
            Continuous Progress Capture
          </h2>
          <p className="text-slate-500">Updating achievements for {activeCycle?.phase} phase</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Updates'}
        </Button>
      </div>

      <div className="grid gap-4">
        {goals.map((goal) => {
          const ach = achievements[goal.id] || {};
          const score = computeScore(goal.uomType, goal.targetValue, ach.actualValue || '');
          
          return (
            <Card key={goal.id} className="overflow-hidden border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-4">
                <div className="p-5 md:col-span-2 border-b md:border-b-0 md:border-r border-slate-100">
                  <Badge variant="outline" className="mb-2 text-[10px] uppercase font-bold text-slate-400">
                    {goal.thrustArea}
                  </Badge>
                  <h4 className="font-bold text-slate-900 mb-1">{goal.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">{goal.description}</p>
                  
                  <div className="flex gap-4 text-xs">
                    <div className="flex flex-col">
                      <span className="text-slate-400 uppercase font-bold">Target</span>
                      <span className="font-bold text-slate-900">{goal.targetValue}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 uppercase font-bold">UoM</span>
                      <span className="font-medium text-slate-700 capitalize">{goal.uomType.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-50/50 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-slate-400">Actual Value</Label>
                    <Input 
                      placeholder="Enter actual..." 
                      className="bg-white text-sm"
                      value={ach.actualValue}
                      onChange={(e) => updateAchievement(goal.id, 'actualValue', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-slate-400">Status</Label>
                    <Select 
                      value={ach.status} 
                      onValueChange={(v) => updateAchievement(goal.id, 'status', v)}
                    >
                      <SelectTrigger className="bg-white h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="on_track">On Track</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-5 flex flex-col items-center justify-center bg-white">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth="6"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        fill="none"
                        stroke={score >= 100 ? '#22c55e' : score > 50 ? '#3b82f6' : '#94a3b8'}
                        strokeWidth="6"
                        strokeDasharray={2 * Math.PI * 34}
                        strokeDashoffset={2 * Math.PI * 34 * (1 - Math.min(score, 100) / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-lg font-bold text-slate-900">{Math.round(score)}%</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest">Progress Score</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementTracking;
