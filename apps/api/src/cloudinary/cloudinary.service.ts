import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export type CloudinaryUploadResult = { secureUrl: string; publicId: string };

/**
 * Uploads and deletes assets on Cloudinary (images, raw PDFs).
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly config: ConfigService) {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');
    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    }
  }

  /** Returns true when Cloudinary env is set (uploads will fail otherwise). */
  isConfigured(): boolean {
    return Boolean(
      this.config.get('CLOUDINARY_CLOUD_NAME') &&
        this.config.get('CLOUDINARY_API_KEY') &&
        this.config.get('CLOUDINARY_API_SECRET'),
    );
  }

  /**
   * Uploads an image buffer to a folder; uses overwrite for stable public_id paths.
   */
  async uploadImage(
    buffer: Buffer,
    options: { folder: string; publicId: string },
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder,
          public_id: options.publicId,
          overwrite: true,
          resource_type: 'image',
          invalidate: true,
        },
        (err, result) => {
          if (err ?? !result) {
            reject(err ?? new Error('Cloudinary upload failed'));
            return;
          }
          resolve({ secureUrl: result.secure_url, publicId: result.public_id });
        },
      );
      stream.end(buffer);
    });
  }

  /**
   * Uploads a binary buffer (e.g. PDF) as raw resource.
   * Use {@link uploadPdf} for prescriptions so URLs end in `.pdf` and browsers get `application/pdf`.
   */
  async uploadRaw(
    buffer: Buffer,
    options: { folder: string; publicId: string },
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder,
          public_id: options.publicId,
          overwrite: true,
          resource_type: 'raw',
          access_mode: 'public',
          invalidate: true,
        },
        (err, result) => {
          if (err ?? !result) {
            reject(err ?? new Error('Cloudinary upload failed'));
            return;
          }
          resolve({ secureUrl: result.secure_url, publicId: result.public_id });
        },
      );
      stream.end(buffer);
    });
  }

  /**
   * Uploads a PDF buffer; forces `public_id` to end with `.pdf` so delivery uses the correct Content-Type.
   */
  async uploadPdf(
    buffer: Buffer,
    options: { folder: string; publicId: string },
  ): Promise<CloudinaryUploadResult> {
    const base = options.publicId.replace(/\.pdf$/i, '');
    const publicIdWithExt = `${base}.pdf`;
    return this.uploadRaw(buffer, { ...options, publicId: publicIdWithExt });
  }

  /**
   * Public delivery URL for a raw asset (same shape as upload `secure_url` when the asset is public).
   */
  getUnsignedRawDeliveryUrl(publicId: string): string {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary is not configured');
    }
    return cloudinary.url(publicId, {
      resource_type: 'raw',
      type: 'upload',
      secure: true,
      sign_url: false,
    });
  }

  /**
   * Signed HTTPS URL for a raw (PDF) asset (restricted / authenticated delivery).
   */
  getSignedRawDeliveryUrl(publicId: string): string {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary is not configured');
    }
    return cloudinary.url(publicId, {
      resource_type: 'raw',
      type: 'upload',
      secure: true,
      sign_url: true,
    });
  }

  /**
   * Returns the canonical `secure_url` for a raw asset (includes version segment when required).
   * Prefer this over {@link getUnsignedRawDeliveryUrl} for server-side fetch — versionless URLs often return 401.
   */
  async getRawResourceSecureUrl(publicId: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary is not configured');
    }
    const result = (await cloudinary.api.resource(publicId, {
      resource_type: 'raw',
    })) as { secure_url?: string };
    const url = result.secure_url;
    if (!url) {
      throw new Error('Cloudinary api.resource returned no secure_url');
    }
    return url;
  }

  /**
   * Removes an asset by `public_id` (safe if missing).
   */
  async destroy(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { invalidate: true });
    } catch (e) {
      this.logger.warn(`Cloudinary destroy failed for ${publicId}: ${(e as Error).message}`);
    }
  }
}
