import jetEnv, { num, str } from 'jet-env';
import tspo from 'tspo';

export const NodeEnvs = {
  DEV: 'development',
  TEST: 'test',
  PRODUCTION: 'production',
} as const;

const EnvVars = jetEnv({
  NodeEnv: (v) => tspo.isValue(NodeEnvs, v),
  Port: num,
  UserServiceGrpcUrl: str,
  CourtServiceUrl: str,
  ReservationServiceUrl: str,
  NotificationServiceUrl: str,
});

export default EnvVars;
