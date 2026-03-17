'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { useMyProfile } from '@/hooks/useApi';
import { useSetAvailability, useMyAvailability } from '@/hooks/useApi';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS: Record<string,string> = {
  monday:'Mon', tuesday:'Tue', wednesday:'Wed',
  thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun',
};

interface Slot {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  maxAppointments: number;
  breakStartTime?: string;
  breakEndTime?: string;
  isActive: boolean;
}

const DEFAULT_SLOT: Omit<Slot,'dayOfWeek'> = {
  startTime: '09:00', endTime: '17:00',
  slotDurationMinutes: 15, maxAppointments: 20, isActive: true,
};

export default function AvailabilityPage() {
  const { data: profile } = useMyProfile();
  const doctorId = profile?.id;

  const { data: existing = [] } = useMyAvailability(doctorId);
  const { mutateAsync: save, isPending } = useSetAvailability();

  const [slots, setSlots] = useState<Slot[]>(() =>
    existing.length > 0 ? existing : []
  );
  const [saved, setSaved] = useState(false);

  const addDay = (day: string) => {
    if (slots.find(s => s.dayOfWeek === day)) return;
    setSlots(prev => [...prev, { dayOfWeek: day, ...DEFAULT_SLOT }]);
  };

  const removeDay = (day: string) => setSlots(prev => prev.filter(s => s.dayOfWeek !== day));

  const updateSlot = (day: string, field: keyof Slot, value: any) => {
    setSlots(prev => prev.map(s => s.dayOfWeek === day ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    await save(slots);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const activeDays = slots.map(s => s.dayOfWeek);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="glass sticky top-0 z-30 border-b border-gray-200 px-6 h-14 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm">
          <ChevronLeft className="w-4 h-4" /> Dashboard
        </Link>
        <h1 className="font-semibold text-gray-800">Availability Settings</h1>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Day selector */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Working Days</h2>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(day => {
              const active = activeDays.includes(day);
              return (
                <button key={day} onClick={() => active ? removeDay(day) : addDay(day)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {DAY_LABELS[day]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Per-day config */}
        {slots.map(slot => (
          <div key={slot.dayOfWeek} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 capitalize">{slot.dayOfWeek}</h3>
              <button onClick={() => removeDay(slot.dayOfWeek)}
                className="text-gray-400 hover:text-red-600 transition-colors p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label text-xs">Start time</label>
                <input type="time" value={slot.startTime}
                  onChange={e => updateSlot(slot.dayOfWeek, 'startTime', e.target.value)}
                  className="input text-sm" />
              </div>
              <div>
                <label className="label text-xs">End time</label>
                <input type="time" value={slot.endTime}
                  onChange={e => updateSlot(slot.dayOfWeek, 'endTime', e.target.value)}
                  className="input text-sm" />
              </div>
              <div>
                <label className="label text-xs">Slot duration (min)</label>
                <select value={slot.slotDurationMinutes}
                  onChange={e => updateSlot(slot.dayOfWeek, 'slotDurationMinutes', Number(e.target.value))}
                  className="input text-sm">
                  {[10,15,20,30,45,60].map(n => <option key={n} value={n}>{n} min</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Max appointments/day</label>
                <input type="number" min={1} max={100} value={slot.maxAppointments}
                  onChange={e => updateSlot(slot.dayOfWeek, 'maxAppointments', Number(e.target.value))}
                  className="input text-sm" />
              </div>
              <div>
                <label className="label text-xs">Break start <span className="text-gray-400">(optional)</span></label>
                <input type="time" value={slot.breakStartTime || ''}
                  onChange={e => updateSlot(slot.dayOfWeek, 'breakStartTime', e.target.value)}
                  className="input text-sm" />
              </div>
              <div>
                <label className="label text-xs">Break end <span className="text-gray-400">(optional)</span></label>
                <input type="time" value={slot.breakEndTime || ''}
                  onChange={e => updateSlot(slot.dayOfWeek, 'breakEndTime', e.target.value)}
                  className="input text-sm" />
              </div>
            </div>
          </div>
        ))}

        {slots.length === 0 && (
          <div className="card p-10 text-center">
            <p className="text-gray-400 text-sm">Select working days above to configure your availability.</p>
          </div>
        )}

        {slots.length > 0 && (
          <button onClick={handleSave} disabled={isPending}
            className="btn-primary w-full flex items-center justify-center gap-2">
            {isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : saved
              ? <><span>✓</span> Saved!</>
              : <><Save className="w-4 h-4" /> Save Availability</>
            }
          </button>
        )}
      </div>
    </div>
  );
}
