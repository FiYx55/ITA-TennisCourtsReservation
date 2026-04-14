export interface Reservation {
  id: string;
  userId: string;
  courtId: string;
  startTime: string;
  endTime: string;
  totalPrice: string;
  status: string;
  createdAt: string;
  courtName?: string;
  courtSurface?: string;
  userName?: string;
}

export interface CreateReservationInput {
  userId: string;
  courtId: string;
  startTime: string;
  totalPrice: string;
}
