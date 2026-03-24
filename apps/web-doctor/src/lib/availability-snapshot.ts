const DAY_ORDER = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export interface AvailabilitySlotLike {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  maxAppointments: number;
  breakStartTime?: string;
  breakEndTime?: string;
  isActive: boolean;
}

/**
 * Stable JSON snapshot for comparing availability state (order-independent by weekday).
 */
export function availabilitySnapshot(slots: AvailabilitySlotLike[]): string {
  const normalized = slots.map((s) => ({
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    slotDurationMinutes: s.slotDurationMinutes,
    maxAppointments: s.maxAppointments,
    breakStartTime: s.breakStartTime ?? '',
    breakEndTime: s.breakEndTime ?? '',
    isActive: s.isActive,
  }));
  const rank = (d: string) => {
    const i = (DAY_ORDER as readonly string[]).indexOf(d);
    return i === -1 ? 99 : i;
  };
  normalized.sort((a, b) => rank(a.dayOfWeek) - rank(b.dayOfWeek));
  return JSON.stringify(normalized);
}
