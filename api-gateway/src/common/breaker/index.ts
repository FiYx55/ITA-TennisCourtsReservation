import CircuitBreaker from 'opossum';
import logger from 'jet-logger';

import EnvVars from '@src/common/constants/env';

export interface BreakerError extends Error {
  code: 'CIRCUIT_OPEN' | 'TIMEOUT' | 'DOWNSTREAM';
  status: number;
}

const DEFAULT_OPTIONS: CircuitBreaker.Options = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
  rollingCountTimeout: 10000,
  rollingCountBuckets: 10,
};

function makeBreakerError(code: BreakerError['code'], status: number, message: string): BreakerError {
  const err = new Error(message) as BreakerError;
  err.code = code;
  err.status = status;
  return err;
}

async function rawFetch(input: { url: string; init?: RequestInit }): Promise<Response> {
  const res = await fetch(input.url, input.init);
  // 5xx counts as a failure for the breaker; 4xx is treated as success (client error,
  // not a downstream-health signal).
  if (res.status >= 500) {
    throw makeBreakerError('DOWNSTREAM', res.status, `Downstream returned ${res.status}`);
  }
  return res;
}

function attachLogging<TArgs extends unknown[], TRes>(
  breaker: CircuitBreaker<TArgs, TRes>,
  name: string,
): void {
  breaker.on('open', () => logger.warn(`[breaker:${name}] OPEN — short-circuiting calls`));
  breaker.on('halfOpen', () => logger.info(`[breaker:${name}] HALF-OPEN — probing`));
  breaker.on('close', () => logger.info(`[breaker:${name}] CLOSED — recovered`));
}

function makeHttpBreaker(name: string) {
  const breaker = new CircuitBreaker(rawFetch, { ...DEFAULT_OPTIONS, name });
  attachLogging(breaker, name);
  return breaker;
}

const httpBreakers = {
  court: makeHttpBreaker('court-service'),
  reservation: makeHttpBreaker('reservation-service'),
  notification: makeHttpBreaker('notification-service'),
};

function buildUrl(base: string, path: string): string {
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export const courtFetch = (path: string, init?: RequestInit) =>
  httpBreakers.court.fire({ url: buildUrl(EnvVars.CourtServiceUrl, path), init });
export const reservationFetch = (path: string, init?: RequestInit) =>
  httpBreakers.reservation.fire({ url: buildUrl(EnvVars.ReservationServiceUrl, path), init });
export const notificationFetch = (path: string, init?: RequestInit) =>
  httpBreakers.notification.fire({ url: buildUrl(EnvVars.NotificationServiceUrl, path), init });

// gRPC user-service breaker — wraps an arbitrary call, since gRPC requests are pre-built promises.
const userGrpcBreaker = new CircuitBreaker(
  async (call: () => Promise<unknown>) => call(),
  { ...DEFAULT_OPTIONS, name: 'user-service' },
);
attachLogging(userGrpcBreaker, 'user-service');

export function userGrpcCall<T>(call: () => Promise<T>): Promise<T> {
  return userGrpcBreaker.fire(call) as Promise<T>;
}

export interface BreakerSnapshot {
  name: string;
  state: 'closed' | 'open' | 'halfOpen';
  stats: CircuitBreaker.Stats;
}

function stateOf(b: CircuitBreaker): BreakerSnapshot['state'] {
  if (b.opened) return 'open';
  if (b.halfOpen) return 'halfOpen';
  return 'closed';
}

export function getBreakerSnapshots(): BreakerSnapshot[] {
  const all: Array<[string, CircuitBreaker]> = [
    ['court-service', httpBreakers.court],
    ['reservation-service', httpBreakers.reservation],
    ['notification-service', httpBreakers.notification],
    ['user-service', userGrpcBreaker],
  ];
  return all.map(([name, b]) => ({ name, state: stateOf(b), stats: b.stats }));
}

export { makeBreakerError };
