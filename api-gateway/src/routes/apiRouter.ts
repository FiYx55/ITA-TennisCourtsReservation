import { Router } from 'express';

import Paths from '@src/common/constants/Paths';

import AuthRoutes from './AuthRoutes';
import UserRoutes from './UserRoutes';
import CourtRoutes from './CourtRoutes';
import ReservationRoutes from './ReservationRoutes';
import NotificationRoutes from './NotificationRoutes';
import AdminRoutes from './AdminRoutes';

const apiRouter = Router();

// ---- Auth ---- //
const authRouter = Router();
authRouter.post(Paths.Auth.Register, AuthRoutes.register);
authRouter.post(Paths.Auth.Login, AuthRoutes.login);
apiRouter.use(Paths.Auth._, authRouter);

// ---- Users (admin) ---- //
const userRouter = Router();
userRouter.get(Paths.Users.GetAll, UserRoutes.getAll);
userRouter.get(Paths.Users.Get, UserRoutes.getOne);
userRouter.put(Paths.Users.Update, UserRoutes.update);
userRouter.delete(Paths.Users.Delete, UserRoutes.delete);
apiRouter.use(Paths.Users._, userRouter);

// ---- Courts ---- //
const courtRouter = Router();
courtRouter.get(Paths.Courts.GetAll, CourtRoutes.getAll);
courtRouter.get(Paths.Courts.Get, CourtRoutes.getOne);
courtRouter.post(Paths.Courts.Create, CourtRoutes.create);
courtRouter.put(Paths.Courts.Update, CourtRoutes.update);
courtRouter.delete(Paths.Courts.Delete, CourtRoutes.delete);
apiRouter.use(Paths.Courts._, courtRouter);

// ---- Reservations ---- //
const reservationRouter = Router();
reservationRouter.get(Paths.Reservations.ByUser, ReservationRoutes.byUser);
reservationRouter.get(Paths.Reservations.Available, ReservationRoutes.available);
reservationRouter.get(Paths.Reservations.Get, ReservationRoutes.getOne);
reservationRouter.get(Paths.Reservations.GetAll, ReservationRoutes.getAll);
reservationRouter.post(Paths.Reservations.Create, ReservationRoutes.create);
reservationRouter.put(Paths.Reservations.Update, ReservationRoutes.update);
reservationRouter.delete(Paths.Reservations.Delete, ReservationRoutes.delete);
apiRouter.use(Paths.Reservations._, reservationRouter);

// ---- Notifications ---- //
const notificationRouter = Router();
notificationRouter.get(Paths.Notifications.UnreadCount, NotificationRoutes.unreadCount);
notificationRouter.get(Paths.Notifications.ByUser, NotificationRoutes.byUser);
notificationRouter.patch(Paths.Notifications.MarkRead, NotificationRoutes.markRead);
notificationRouter.delete(Paths.Notifications.Delete, NotificationRoutes.delete);
notificationRouter.post(Paths.Notifications.Create, NotificationRoutes.create);
apiRouter.use(Paths.Notifications._, notificationRouter);

// ---- Admin Dashboard ---- //
const adminRouter = Router();
adminRouter.get(Paths.AdminDashboard.Dashboard, AdminRoutes.dashboard);
apiRouter.use(Paths.AdminDashboard._, adminRouter);

export default apiRouter;
