import { Router } from 'express';

import { requireAuth, requireRole } from '@src/common/auth/authMiddleware';
import Paths from '@src/common/constants/Paths';

import AuthRoutes from './AuthRoutes';
import UserRoutes from './UserRoutes';
import CourtRoutes from './CourtRoutes';
import ReservationRoutes from './ReservationRoutes';
import NotificationRoutes from './NotificationRoutes';
import AdminRoutes from './AdminRoutes';

const apiRouter = Router();

const requireAdmin = [requireAuth, requireRole('admin')];

// ---- Auth (public) ---- //
const authRouter = Router();
authRouter.post(Paths.Auth.Register, AuthRoutes.register);
authRouter.post(Paths.Auth.Login, AuthRoutes.login);
apiRouter.use(Paths.Auth._, authRouter);

// ---- Users (admin only) ---- //
const userRouter = Router();
userRouter.get(Paths.Users.GetAll, requireAdmin, UserRoutes.getAll);
userRouter.get(Paths.Users.Get, requireAdmin, UserRoutes.getOne);
userRouter.put(Paths.Users.Update, requireAdmin, UserRoutes.update);
userRouter.delete(Paths.Users.Delete, requireAdmin, UserRoutes.delete);
apiRouter.use(Paths.Users._, userRouter);

// ---- Courts (read public, write admin) ---- //
const courtRouter = Router();
courtRouter.get(Paths.Courts.GetAll, CourtRoutes.getAll);
courtRouter.get(Paths.Courts.Get, CourtRoutes.getOne);
courtRouter.post(Paths.Courts.Create, requireAdmin, CourtRoutes.create);
courtRouter.put(Paths.Courts.Update, requireAdmin, CourtRoutes.update);
courtRouter.delete(Paths.Courts.Delete, requireAdmin, CourtRoutes.delete);
apiRouter.use(Paths.Courts._, courtRouter);

// ---- Reservations ---- //
const reservationRouter = Router();
reservationRouter.get(Paths.Reservations.ByUser, requireAuth, ReservationRoutes.byUser);
reservationRouter.get(Paths.Reservations.Available, requireAuth, ReservationRoutes.available);
reservationRouter.get(Paths.Reservations.Get, requireAuth, ReservationRoutes.getOne);
reservationRouter.get(Paths.Reservations.GetAll, requireAdmin, ReservationRoutes.getAll);
reservationRouter.post(Paths.Reservations.Create, requireAuth, ReservationRoutes.create);
reservationRouter.put(Paths.Reservations.Update, requireAdmin, ReservationRoutes.update);
reservationRouter.delete(Paths.Reservations.Delete, requireAuth, ReservationRoutes.delete);
apiRouter.use(Paths.Reservations._, reservationRouter);

// ---- Notifications ---- //
const notificationRouter = Router();
notificationRouter.get(Paths.Notifications.UnreadCount, requireAuth, NotificationRoutes.unreadCount);
notificationRouter.get(Paths.Notifications.ByUser, requireAuth, NotificationRoutes.byUser);
notificationRouter.patch(Paths.Notifications.MarkRead, requireAuth, NotificationRoutes.markRead);
notificationRouter.delete(Paths.Notifications.Delete, requireAdmin, NotificationRoutes.delete);
notificationRouter.post(Paths.Notifications.Create, requireAdmin, NotificationRoutes.create);
apiRouter.use(Paths.Notifications._, notificationRouter);

// ---- Admin Dashboard ---- //
const adminRouter = Router();
adminRouter.get(Paths.AdminDashboard.Dashboard, requireAdmin, AdminRoutes.dashboard);
apiRouter.use(Paths.AdminDashboard._, adminRouter);

export default apiRouter;
