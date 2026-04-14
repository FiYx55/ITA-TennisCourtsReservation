export const config = {
  port: parseInt(process.env.PORT || '2007', 10),
  userServiceGrpcUrl: process.env.USER_SERVICE_GRPC_URL || 'localhost:2002',
  courtServiceUrl: process.env.COURT_SERVICE_URL || 'http://localhost:2003',
  reservationServiceUrl: process.env.RESERVATION_SERVICE_URL || 'http://localhost:2004',
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:2006',
};
