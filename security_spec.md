# AtomQuest Security Specification

## Data Invariants
1. **User Identity**: A user cannot modify their own role or department.
2. **Goal Cycle Integrity**: Only one cycle can be 'active' at a time (ideally), and users cannot create goals outside the window.
3. **Goal Sheet Lock**: Once a goal sheet is 'approved', it becomes read-only for employees.
4. **Manager-Employee Relationship**: Managers can only review goal sheets of their direct reports.
5. **Weightage Balance**: Total weightage on a goal sheet must be exactly 100%.

## The Dirty Dozen (Threat Vectors)
1. **Self-Promotion**: Employee attempts to update their `role` to `admin`.
2. **Shadow Goals**: Employee adds a 9th goal to their sheet.
3. **Weightage Inflation**: Employee submits goals with 150% total weightage.
4. **Post-Approval Tampering**: Employee tries to change a target value after the manager has approved it.
5. **Manager Impersonation**: Employee A tries to approve their own goal sheet using Employee B's ID.
6. **Cross-Team Peeking**: Employee A tries to read Employee B's private goal sheet.
7. **Cycle Hijacking**: Non-admin tries to activate a new goal cycle.
8. **Achievement Spoofing**: Employee tries to update achievement for a goal they don't own.
9. **Audit Trail Deletion**: User tries to delete an audit log entry.
10. **Shared Goal Mutation**: Recipient of a shared goal tries to change the `title` or `targetValue`.
11. **Junk ID Injection**: Attacker tries to create a goal with a 2MB string as an ID.
12. **Null Window Bypass**: Attacker tries to submit goals when `windowCloseDate` has passed.

## Test Runner Plan
- `firestore.rules.test.ts` will verify that these 12 operations return `PERMISSION_DENIED`.
