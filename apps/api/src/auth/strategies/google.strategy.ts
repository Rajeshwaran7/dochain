import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

const PLACEHOLDER = 'your-google-client-id';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(config: ConfigService) {
    const clientID = config.get('GOOGLE_CLIENT_ID', PLACEHOLDER);
    const isConfigured = clientID !== PLACEHOLDER && clientID !== '';

    super({
      clientID: isConfigured ? clientID : 'disabled',
      clientSecret: config.get('GOOGLE_CLIENT_SECRET', 'disabled'),
      callbackURL: config.get('GOOGLE_CALLBACK_URL', 'http://localhost:4000/auth/google/callback'),
      scope: ['email', 'profile'],
    });

    if (!isConfigured) {
      this.logger.warn('Google OAuth is not configured. Set GOOGLE_CLIENT_ID in .env to enable it.');
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Record<string, unknown>,
    done: VerifyCallback,
  ) {
    const { name, emails, photos, id } = profile as {
      name: { givenName: string; familyName: string };
      emails: Array<{ value: string }>;
      photos: Array<{ value: string }>;
      id: string;
    };
    const user = {
      googleId: id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0]?.value,
    };
    done(null, user);
  }
}
