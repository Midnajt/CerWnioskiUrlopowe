export type Employee = {
  id: string;
  authUserId: string | null;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  departmentId: string;
  departmentName: string;
  locationId: string;
  locationName: string;
  jobTitle: string;
  managerId: string | null;
  fte: number;
  isDirector: boolean;
  isHr: boolean;
  active: boolean;
};

export type EmployeeOption = {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  active: boolean;
};

export type LeaveRequest = {
  id: string;
  requestNumber: string;
  employeeId: string;
  leaveType: "current" | "overdue";
  status:
    | "roboczy"
    | "oczekuje_przelozonego"
    | "oczekuje_dyrektora"
    | "oczekuje_kadr"
    | "zaakceptowany"
    | "odrzucony"
    | "cofniety_pracownik"
    | "wycofany";
  dateFrom: string;
  dateTo: string;
  workingDays: number;
  calendarDays: number;
  requiresDirector: boolean;
  substituteEmployeeId: string | null;
  managerAssigneeId: string | null;
  directorAssigneeId: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeaveEvent = {
  id: string;
  requestId: string;
  actorId: string | null;
  action: string;
  comment: string | null;
  fromStatus: string | null;
  toStatus: string;
  createdAt: string;
};

export type NotificationItem = {
  id: string;
  requestId: string | null;
  body: string;
  readAt: string | null;
  createdAt: string;
};
