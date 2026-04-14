export interface DashboardStats {
  userCount: number;
  courtCount: number;
  totalReservations: number;
  todaysReservations: number;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  isActive: boolean;
}
