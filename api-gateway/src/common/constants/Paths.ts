const Paths = {
  _: '/api',
  Auth: {
    _: '/auth',
    Register: '/register',
    Login: '/login',
  },
  Users: {
    _: '/users',
    GetAll: '/',
    Get: '/:id',
    Update: '/:id',
    Delete: '/:id',
  },
  Courts: {
    _: '/courts',
    GetAll: '/',
    Get: '/:id',
    Create: '/',
    Update: '/:id',
    Delete: '/:id',
  },
  Reservations: {
    _: '/reservations',
    GetAll: '/',
    Get: '/:id',
    ByUser: '/user/:userId',
    Available: '/court/:courtId/available',
    Create: '/',
    Update: '/:id',
    Delete: '/:id',
  },
  Notifications: {
    _: '/notifications',
    ByUser: '/:userId',
    UnreadCount: '/:userId/unread/count',
    MarkRead: '/:id/read',
    Delete: '/:id',
    Create: '/',
  },
  AdminDashboard: {
    _: '/admin',
    Dashboard: '/dashboard',
  },
  Health: '/health',
} as const;

export default Paths;
