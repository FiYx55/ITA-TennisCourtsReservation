export interface Court {
  id: string;
  name: string;
  surface: "clay" | "grass" | "hard";
  is_indoor: boolean;
  hourly_rate: number;
  is_active: boolean;
}

export interface Slot {
  startTime: string;
  available: boolean;
}

export interface CourtWithAvailability extends Court {
  availability: Slot[];
}
