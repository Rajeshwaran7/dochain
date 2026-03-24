import { prescriptionsApi } from '@/lib/api';
import { toast } from 'sonner';

/**
 * Extracts Nest JSON `message` when the API returns an error body as a blob (axios + responseType blob).
 */
async function messageFromPrescriptionDownloadError(err: unknown): Promise<string | null> {
  const ax = err as { response?: { data?: unknown; status?: number } };
  const data = ax.response?.data;
  if (data instanceof Blob) {
    const text = await data.text();
    try {
      const j = JSON.parse(text) as { message?: string };
      return j.message ?? `Request failed (${ax.response?.status ?? 'error'})`;
    } catch {
      return text.trim().slice(0, 200) || null;
    }
  }
  return null;
}

/** Axios may leave `type` empty; verify PDF magic bytes. */
async function blobLooksLikePdf(blob: Blob): Promise<boolean> {
  if (blob.size < 5) return false;
  const head = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  const ascii = String.fromCharCode(...Array.from(head));
  return ascii === '%PDF';
}

/**
 * Downloads a prescription PDF using the auth token (avoids Cloudinary / API 401 in a new tab).
 */
export async function downloadPrescriptionPdf(id: string): Promise<void> {
  try {
    const res = await prescriptionsApi.downloadPdf(id);
    const raw = res.data as Blob;
    if (!(await blobLooksLikePdf(raw))) {
      const text = await raw.text();
      try {
        const j = JSON.parse(text) as { message?: string };
        toast.error(j.message ?? 'Download did not return a PDF.');
      } catch {
        toast.error('Download did not return a valid PDF.');
      }
      return;
    }
    const url = window.URL.createObjectURL(raw);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription-${id.slice(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    const msg = await messageFromPrescriptionDownloadError(err);
    toast.error(msg ?? 'Could not download prescription. Try signing in again.');
  }
}
