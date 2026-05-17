export type UserRole = 'employee' | 'manager' | 'admin';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  managerId?: string;
  department: string;
  createdAt: string;
}

export type GoalCyclePhase = 'goal_setting' | 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface GoalCycle {
  id: string;
  name: string;
  phase: GoalCyclePhase;
  windowOpenDate: string;
  windowCloseDate: string;
  isActive: boolean;
}

export type GoalSheetStatus = 'draft' | 'submitted' | 'approved' | 'returned';

export interface GoalSheet {
  id: string;
  employeeId: string;
  cycleId: string;
  status: GoalSheetStatus;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export type UoMType = 'numeric_min' | 'numeric_max' | 'timeline' | 'zero';

export interface Goal {
  id: string;
  goalSheetId: string;
  thrustArea: string;
  title: string;
  description: string;
  uomType: UoMType;
  targetValue: string;
  weightage: number;
  isShared: boolean;
  sharedFromGoalId?: string;
  createdAt: string;
}

export type AchievementStatus = 'not_started' | 'on_track' | 'completed';

export interface GoalAchievement {
  id: string;
  goalId: string;
  cyclePhase: GoalCyclePhase;
  actualValue: string;
  status: AchievementStatus;
  updatedAt: string;
  score?: number; // Computed visibility only
}

export interface CheckinComment {
  id: string;
  goalSheetId: string;
  managerId: string;
  comment: string;
  phase: GoalCyclePhase;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  changedBy: string;
  changeDescription: string;
  oldValue?: any;
  newValue?: any;
  changedAt: string;
}
