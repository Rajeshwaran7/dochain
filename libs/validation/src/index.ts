import { z } from 'zod';

// ── Auth ──────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName:  z.string().min(1, 'Last name is required'),
  email:     z.string().email('Invalid email address'),
  password:  z.string().min(8, 'Password must be at least 8 characters')
               .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
               .regex(/[0-9]/, 'Must contain at least one number'),
  phone:     z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number').optional(),
  role:      z.enum(['patient', 'doctor']).default('patient'),
});

// ── Doctor ────────────────────────────────────────────────────────────────
export const doctorProfileSchema = z.object({
  specialization:    z.string().min(2),
  subSpecialization: z.string().optional(),
  experienceYears:   z.number().min(0).max(70),
  qualification:     z.string().optional(),
  registrationNumber: z.string().optional(),
  bio:               z.string().max(1000).optional(),
  consultationFee:   z.number().min(0),
  city:              z.string().min(2),
  state:             z.string().optional(),
  languages:         z.array(z.string()).optional(),
  services:          z.array(z.string()).optional(),
});

export const clinicSchema = z.object({
  name:         z.string().min(2),
  description:  z.string().optional(),
  addressLine1: z.string().min(5),
  addressLine2: z.string().optional(),
  city:         z.string().min(2),
  state:        z.string().min(2),
  pincode:      z.string().regex(/^[0-9]{6}$/, 'Invalid pincode'),
  landmark:     z.string().optional(),
  phone:        z.string().optional(),
  email:        z.string().email().optional().or(z.literal('')),
  website:      z.string().url().optional().or(z.literal('')),
});

// ── Appointment ───────────────────────────────────────────────────────────
export const bookAppointmentSchema = z.object({
  doctorId:        z.string().uuid(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  startTime:       z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  endTime:         z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  type:            z.enum(['in_person', 'video']).default('in_person'),
  symptoms:        z.string().max(500).optional(),
  notes:           z.string().max(500).optional(),
});

// ── Review ────────────────────────────────────────────────────────────────
export const reviewSchema = z.object({
  doctorId:      z.string().uuid(),
  appointmentId: z.string().uuid(),
  rating:        z.number().int().min(1).max(5),
  comment:       z.string().max(500).optional(),
});

// ── Availability ──────────────────────────────────────────────────────────
export const availabilitySlotSchema = z.object({
  dayOfWeek:           z.enum(['monday','tuesday','wednesday','thursday','friday','saturday','sunday']),
  startTime:           z.string().regex(/^\d{2}:\d{2}$/),
  endTime:             z.string().regex(/^\d{2}:\d{2}$/),
  slotDurationMinutes: z.number().min(5).max(120).default(15),
  maxAppointments:     z.number().min(1).max(100).default(20),
  breakStartTime:      z.string().optional(),
  breakEndTime:        z.string().optional(),
  isActive:            z.boolean().default(true),
});

export type LoginInput            = z.infer<typeof loginSchema>;
export type RegisterInput         = z.infer<typeof registerSchema>;
export type DoctorProfileInput    = z.infer<typeof doctorProfileSchema>;
export type ClinicInput           = z.infer<typeof clinicSchema>;
export type BookAppointmentInput  = z.infer<typeof bookAppointmentSchema>;
export type ReviewInput           = z.infer<typeof reviewSchema>;
export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>;
