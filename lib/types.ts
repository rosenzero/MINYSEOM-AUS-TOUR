export interface TripInfo {
  title: string;
  startDate: string;
  endDate: string;
  members: string[];
}

export interface TripDay {
  date: string;
  day: string;
}

export interface TripEvent {
  dayIdx: number;
  start: string;
  end: string;
  title: string;
  location: string;
}

export interface Accommodation {
  name: string;
  city: string;
  checkIn: string;
  checkOut: string;
  address: string;
  price: number;
  confirmation: string;
  notes: string;
}

export interface PackingItem {
  category: string;
  item: string;
  done: boolean;
}

export interface Expense {
  date: string;
  category: string;
  item: string;
  amount: number;
  currency: string;
  paidBy: string;
}

export interface TripData {
  info: TripInfo;
  days: TripDay[];
  events: TripEvent[];
  accommodations: Accommodation[];
  packing: PackingItem[];
  expenses: Expense[];
}

export type EventStatus = 'past' | 'current' | 'upcoming';

export interface ResolvedTripEvent extends TripEvent {
  uid: string;
  startDate: Date;
  endDate: Date;
  tz: string;
}
