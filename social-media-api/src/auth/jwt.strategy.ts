import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    // --- FIX IS HERE ---
    // We add a check to ensure the secret is loaded before passing it to super()
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error(
        'JWT_SECRET not found in environment variables. Did you set it in your .env file?',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret, // Now we pass the validated secret
    });
  }

  async validate(payload: any) {
    // The payload is the decoded JWT.
    // The properties here (userId, username) are based on what we put in the payload
    // during the login method in auth.service.ts
    return { userId: payload.sub, username: payload.username };
  }
}
