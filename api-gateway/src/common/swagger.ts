const uuidParam = (name: string) => ({
  in: 'path',
  name,
  required: true,
  schema: { type: 'string', format: 'uuid' },
});

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    role: { type: 'string', enum: ['user', 'admin'] },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const courtSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    surface: { type: 'string', enum: ['clay', 'grass', 'hard'] },
    is_indoor: { type: 'boolean' },
    hourly_rate: { type: 'number' },
    is_active: { type: 'boolean' },
  },
};

const reservationSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    courtId: { type: 'string', format: 'uuid' },
    startTime: { type: 'string', format: 'date-time' },
    endTime: { type: 'string', format: 'date-time' },
    totalPrice: { type: 'string' },
    status: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    courtName: { type: 'string' },
    courtSurface: { type: 'string' },
    userName: { type: 'string' },
  },
};

const notificationSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    type: { type: 'string' },
    title: { type: 'string' },
    message: { type: 'string' },
    isRead: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Tennis Courts - Web API Gateway',
    description:
      'Web API gateway following the Backend for Frontend (BFF) pattern. Aggregates and enriches data from user-service (gRPC), court-service, reservation-service, and notification-service.',
    version: '1.0.0',
  },
  servers: [{ url: '/api' }],
  tags: [
    { name: 'Auth', description: 'Authentication and registration' },
    { name: 'Users', description: 'User management (admin)' },
    { name: 'Courts', description: 'Court catalog' },
    { name: 'Reservations', description: 'Booking management' },
    { name: 'Notifications', description: 'User notifications' },
    { name: 'Admin', description: 'Admin dashboard' },
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'firstName', 'lastName', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User created', content: { 'application/json': { schema: userSchema } } },
          400: { description: 'Registration failed' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login (aggregates VerifyUser + GetUser via gRPC)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated', content: { 'application/json': { schema: userSchema } } },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List all users (admin)',
        responses: {
          200: { description: 'List of users', content: { 'application/json': { schema: { type: 'array', items: userSchema } } } },
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        parameters: [uuidParam('id')],
        responses: { 200: { description: 'User', content: { 'application/json': { schema: userSchema } } }, 404: { description: 'Not found' } },
      },
      put: {
        tags: ['Users'],
        summary: 'Update user',
        parameters: [uuidParam('id')],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated', content: { 'application/json': { schema: userSchema } } } },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user (admin)',
        parameters: [uuidParam('id')],
        responses: { 204: { description: 'Deleted' }, 404: { description: 'Not found' } },
      },
    },
    '/courts': {
      get: {
        tags: ['Courts'],
        summary: 'List all courts',
        responses: { 200: { description: 'List of courts', content: { 'application/json': { schema: { type: 'array', items: courtSchema } } } } },
      },
      post: {
        tags: ['Courts'],
        summary: 'Create a court (admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'surface', 'hourly_rate'],
                properties: {
                  name: { type: 'string' },
                  surface: { type: 'string', enum: ['clay', 'grass', 'hard'] },
                  is_indoor: { type: 'boolean' },
                  hourly_rate: { type: 'number' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Created', content: { 'application/json': { schema: courtSchema } } } },
      },
    },
    '/courts/{id}': {
      get: {
        tags: ['Courts'],
        summary: 'Get court details + today\'s available slots (aggregated)',
        parameters: [uuidParam('id')],
        responses: { 200: { description: 'Court with availability' }, 404: { description: 'Not found' } },
      },
      put: {
        tags: ['Courts'],
        summary: 'Update a court (admin)',
        parameters: [uuidParam('id')],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: courtSchema } },
        },
        responses: { 200: { description: 'Updated' } },
      },
      delete: {
        tags: ['Courts'],
        summary: 'Delete a court (admin)',
        parameters: [uuidParam('id')],
        responses: { 204: { description: 'Deleted' } },
      },
    },
    '/reservations': {
      get: {
        tags: ['Reservations'],
        summary: 'List all reservations enriched with court + user names (admin)',
        responses: { 200: { description: 'Reservations', content: { 'application/json': { schema: { type: 'array', items: reservationSchema } } } } },
      },
      post: {
        tags: ['Reservations'],
        summary: 'Create reservation (verifies court exists, returns enriched response)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'courtId', 'startTime', 'totalPrice'],
                properties: {
                  userId: { type: 'string', format: 'uuid' },
                  courtId: { type: 'string', format: 'uuid' },
                  startTime: { type: 'string', format: 'date-time', description: 'Must be on a full hour, 7:00-21:00 UTC' },
                  totalPrice: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Reservation created', content: { 'application/json': { schema: reservationSchema } } },
          400: { description: 'Invalid input (must be full hour, within operating hours)' },
          409: { description: 'Time slot already booked' },
        },
      },
    },
    '/reservations/{id}': {
      get: {
        tags: ['Reservations'],
        summary: 'Get reservation enriched with court + user details',
        parameters: [uuidParam('id')],
        responses: { 200: { description: 'Reservation', content: { 'application/json': { schema: reservationSchema } } }, 404: { description: 'Not found' } },
      },
      put: {
        tags: ['Reservations'],
        summary: 'Update reservation (admin)',
        parameters: [uuidParam('id')],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  startTime: { type: 'string', format: 'date-time' },
                  totalPrice: { type: 'string' },
                  status: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated' } },
      },
      delete: {
        tags: ['Reservations'],
        summary: 'Cancel reservation',
        parameters: [uuidParam('id')],
        responses: { 204: { description: 'Cancelled' }, 404: { description: 'Not found' } },
      },
    },
    '/reservations/user/{userId}': {
      get: {
        tags: ['Reservations'],
        summary: 'Get user\'s reservations enriched with court names',
        parameters: [uuidParam('userId')],
        responses: { 200: { description: 'User reservations', content: { 'application/json': { schema: { type: 'array', items: reservationSchema } } } } },
      },
    },
    '/reservations/court/{courtId}/available': {
      get: {
        tags: ['Reservations'],
        summary: 'Get available time slots for a court on a date',
        parameters: [
          uuidParam('courtId'),
          { in: 'query', name: 'date', required: true, schema: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' }, description: 'YYYY-MM-DD' },
        ],
        responses: {
          200: {
            description: 'Slot availability',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    courtId: { type: 'string' },
                    date: { type: 'string' },
                    slots: { type: 'array', items: { type: 'object', properties: { startTime: { type: 'string' }, available: { type: 'boolean' } } } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/notifications/{userId}': {
      get: {
        tags: ['Notifications'],
        summary: 'Get user\'s notifications',
        parameters: [uuidParam('userId')],
        responses: { 200: { description: 'Notifications', content: { 'application/json': { schema: { type: 'array', items: notificationSchema } } } } },
      },
    },
    '/notifications/{userId}/unread/count': {
      get: {
        tags: ['Notifications'],
        summary: 'Unread notification count',
        parameters: [uuidParam('userId')],
        responses: { 200: { description: 'Count', content: { 'application/json': { schema: { type: 'object', properties: { count: { type: 'integer' } } } } } } },
      },
    },
    '/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark notification as read',
        parameters: [uuidParam('id')],
        responses: { 200: { description: 'Marked as read', content: { 'application/json': { schema: notificationSchema } } } },
      },
    },
    '/notifications/{id}': {
      delete: {
        tags: ['Notifications'],
        summary: 'Delete notification (admin)',
        parameters: [uuidParam('id')],
        responses: { 204: { description: 'Deleted' } },
      },
    },
    '/notifications': {
      post: {
        tags: ['Notifications'],
        summary: 'Create notification (admin/internal)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'type', 'title', 'message'],
                properties: {
                  userId: { type: 'string', format: 'uuid' },
                  type: { type: 'string' },
                  title: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Created', content: { 'application/json': { schema: notificationSchema } } } },
      },
    },
    '/admin/dashboard': {
      get: {
        tags: ['Admin'],
        summary: 'Aggregated admin dashboard (user count + court count + reservation counts)',
        responses: {
          200: {
            description: 'Dashboard stats',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    userCount: { type: 'integer' },
                    courtCount: { type: 'integer' },
                    totalReservations: { type: 'integer' },
                    todaysReservations: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
