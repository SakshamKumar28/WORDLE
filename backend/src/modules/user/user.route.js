import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import userController from "./user.controller.js";

const userRouter = Router();

// Apply auth middleware to all user routes
userRouter.use(authenticate);

userRouter.get('/friends', (req, res, next) => userController.getFriends(req, res, next));
userRouter.get('/leaderboard', (req, res, next) => userController.getLeaderboard(req, res, next));

userRouter.get('/friends/requests', (req, res, next) => userController.getFriendRequests(req, res, next));
userRouter.post('/friends/request', (req, res, next) => userController.sendFriendRequest(req, res, next));
userRouter.post('/friends/respond', (req, res, next) => userController.respondToFriendRequest(req, res, next));

export default userRouter;
