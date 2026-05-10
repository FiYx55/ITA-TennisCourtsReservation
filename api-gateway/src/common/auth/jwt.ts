import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

import EnvVars from '@src/common/constants/env';

export interface AuthTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export function signToken(user: { id: string; email: string; role: string }): string {
  const payload: Omit<AuthTokenPayload, keyof JwtPayload> = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
  const options: SignOptions = { expiresIn: EnvVars.JwtExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, EnvVars.JwtSecret, options);
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, EnvVars.JwtSecret) as AuthTokenPayload;
}
