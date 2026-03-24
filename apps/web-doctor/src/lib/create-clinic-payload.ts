/** Keys allowed by `POST /doctors/clinic` (`CreateClinicDto`). */
const CREATE_CLINIC_FIELDS = [
  'name',
  'description',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'pincode',
  'landmark',
  'latitude',
  'longitude',
  'phone',
  'email',
  'website',
  'photos',
  'amenities',
] as const;

/**
 * Strips entity fields (`id`, `doctorId`, timestamps, etc.) so the API accepts the body
 * under `forbidNonWhitelisted` validation.
 */
export function sanitizeCreateClinicPayload(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of CREATE_CLINIC_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) {
      continue;
    }
    const v = data[key];
    if (v === null && (key === 'latitude' || key === 'longitude')) {
      continue;
    }
    if ((key === 'photos' || key === 'amenities') && (v === null || v === undefined)) {
      continue;
    }
    out[key] = v;
  }
  return out;
}
