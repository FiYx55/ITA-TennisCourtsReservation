import { Router, type Request, type Response, type Router as RouterType } from "express";
import { firstValueFrom } from "rxjs";
import { filter, take } from "rxjs/operators";
import { Notification } from "../db/Notification.js";
import { emitNotification, notification$ } from "../streams/notificationStream.js";
import { logger } from "../config/logger.js";

export const router: RouterType = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         isRead:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *     CreateNotification:
 *       type: object
 *       required:
 *         - userId
 *         - type
 *         - title
 *         - message
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           example: reservation_confirmed
 *         title:
 *           type: string
 *           example: Reservation Confirmed
 *         message:
 *           type: string
 *           example: Your court booking has been confirmed.
 */

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Create a notification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNotification'
 *     responses:
 *       201:
 *         description: Notification created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Missing required fields
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { userId, type, title, message } = req.body as {
    userId?: string;
    type?: string;
    title?: string;
    message?: string;
  };

  if (!userId || !type || !title || !message) {
    res.status(400).json({ error: "userId, type, title and message are required" });
    return;
  }

  // Wait for the reactive stream to process and return the result
  const resultPromise = firstValueFrom(
    notification$.pipe(
      filter((n) => n.userId === userId && n.title === title),
      take(1)
    )
  );

  // Emit into the reactive pipeline
  emitNotification({ userId, type, title, message });

  const processed = await resultPromise;
  res.status(201).json(processed);
});

/**
 * @swagger
 * /notifications/{userId}:
 *   get:
 *     summary: Get all notifications for a user
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
router.get("/:userId", async (req: Request, res: Response): Promise<void> => {
  const notifications = await Notification.findAll({
    where: { userId: req.params["userId"] as string },
    order: [["createdAt", "DESC"]],
  });
  logger.controller.info(`Fetched ${notifications.length} for user ${req.params["userId"] as string}`);
  res.json(notifications);
});

/**
 * @swagger
 * /notifications/{userId}/unread/count:
 *   get:
 *     summary: Get unread notification count for a user
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Unread count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 */
router.get("/:userId/unread/count", async (req: Request, res: Response): Promise<void> => {
  const count = await Notification.count({
    where: { userId: req.params["userId"] as string, isRead: false },
  });
  logger.controller.info(`Unread count for ${req.params["userId"] as string}: ${count}`);
  res.json({ count });
});

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       404:
 *         description: Notification not found
 */
router.patch("/:id/read", async (req: Request, res: Response): Promise<void> => {
  const notification = await Notification.findByPk(req.params["id"] as string);
  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  notification.isRead = true;
  await notification.save();
  logger.controller.info(`Marked as read: ${notification.id}`);
  res.json(notification);
});

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Notification deleted
 *       404:
 *         description: Notification not found
 */
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const notification = await Notification.findByPk(req.params["id"] as string);
  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  await notification.destroy();
  logger.controller.info(`Deleted: ${req.params["id"] as string}`);
  res.status(204).send();
});
