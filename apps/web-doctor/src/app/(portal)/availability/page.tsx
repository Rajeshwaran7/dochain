'use client';

import { useState, useEffect } from 'react';
import { Trash2, Save, Loader2 } from 'lucide-react';
import { useMyProfile, useSetAvailability, useMyAvailability } from '@/hooks/useApi';
import { availabilitySnapshot, type AvailabilitySlotLike } from '@/lib/availability-snapshot';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

type Slot = AvailabilitySlotLike;

const DEFAULT_SLOT: Omit<Slot, 'dayOfWeek'> = {
  startTime: '09:00',
  endTime: '17:00',
  slotDurationMinutes: 15,
  maxAppointments: 20,
  isActive: true,
};

export default function AvailabilityPage() {
  const { data: profile } = useMyProfile();
  const doctorId = profile?.id;

  const { data: existing = [], isSuccess } = useMyAvailability(doctorId);
  const { mutateAsync: save, isPending } = useSetAvailability();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [saved, setSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [baselineSnapshot, setBaselineSnapshot] = useState('');

  useEffect(() => {
    if (isSuccess && !initialized) {
      const next = (existing.length > 0 ? existing : []) as Slot[];
      setSlots(next);
      setBaselineSnapshot(availabilitySnapshot(next));
      setInitialized(true);
    }
  }, [isSuccess, existing, initialized]);

  const addDay = (day: string) => {
    if (isPending) {
      return;
    }
    if (slots.find((s) => s.dayOfWeek === day)) {
      return;
    }
    setSlots((prev) => [...prev, { dayOfWeek: day, ...DEFAULT_SLOT }]);
  };

  const removeDay = (day: string) => {
    if (isPending) {
      return;
    }
    setSlots((prev) => prev.filter((s) => s.dayOfWeek !== day));
  };

  const updateSlot = (day: string, field: keyof Slot, value: string | number | boolean) => {
    if (isPending) {
      return;
    }
    setSlots((prev) =>
      prev.map((s) => (s.dayOfWeek === day ? { ...s, [field]: value } : s)),
    );
  };

  const dirty = initialized && baselineSnapshot !== availabilitySnapshot(slots);

  const handleSave = async () => {
    await save(slots);
    setBaselineSnapshot(availabilitySnapshot(slots));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const activeDays = slots.map((s) => s.dayOfWeek);
  const formBusy = isPending;

  return (
    <div className="space-y-6 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className={`card p-5 ${formBusy ? 'pointer-events-none opacity-60' : ''}`}>
          <h2 className="mb-4 font-semibold text-gray-900">Working Days</h2>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const active = activeDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => (active ? removeDay(day) : addDay(day))}
                  disabled={formBusy}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {DAY_LABELS[day]}
                </button>
              );
            })}
          </div>
        </div>

        {slots.map((slot) => (
          <div key={slot.dayOfWeek} className={`card p-5 ${formBusy ? 'pointer-events-none opacity-60' : ''}`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold capitalize text-gray-900">{slot.dayOfWeek}</h3>
              <button
                type="button"
                onClick={() => removeDay(slot.dayOfWeek)}
                disabled={formBusy}
                className="p-1 text-gray-500 transition-colors hover:text-red-600"
                aria-label={`Remove ${slot.dayOfWeek}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label text-xs">Start time</label>
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateSlot(slot.dayOfWeek, 'startTime', e.target.value)}
                  disabled={formBusy}
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="label text-xs">End time</label>
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateSlot(slot.dayOfWeek, 'endTime', e.target.value)}
                  disabled={formBusy}
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="label text-xs">Slot duration (min)</label>
                <select
                  value={slot.slotDurationMinutes}
                  onChange={(e) =>
                    updateSlot(slot.dayOfWeek, 'slotDurationMinutes', Number(e.target.value))
                  }
                  disabled={formBusy}
                  className="input text-sm"
                >
                  {[10, 15, 20, 30, 45, 60].map((n) => (
                    <option key={n} value={n}>
                      {n} min
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label text-xs">Max appointments/day</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={slot.maxAppointments}
                  onChange={(e) =>
                    updateSlot(slot.dayOfWeek, 'maxAppointments', Number(e.target.value))
                  }
                  disabled={formBusy}
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="label text-xs">
                  Break start <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="time"
                  value={slot.breakStartTime ?? ''}
                  onChange={(e) => updateSlot(slot.dayOfWeek, 'breakStartTime', e.target.value)}
                  disabled={formBusy}
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="label text-xs">
                  Break end <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="time"
                  value={slot.breakEndTime ?? ''}
                  onChange={(e) => updateSlot(slot.dayOfWeek, 'breakEndTime', e.target.value)}
                  disabled={formBusy}
                  className="input text-sm"
                />
              </div>
            </div>
          </div>
        ))}

        {slots.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm text-gray-600">Select working days above to configure your availability.</p>
            {initialized ? (
              <p className="mt-2 text-xs text-gray-500">
                Click Save to clear all availability if you removed all days.
              </p>
            ) : null}
          </div>
        ) : null}

        {initialized ? (
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !dirty}
            className="btn-primary flex w-full items-center justify-center gap-2"
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : saved ? (
              <>
                <span>✓</span> Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" aria-hidden />
                Save Availability
              </>
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}
