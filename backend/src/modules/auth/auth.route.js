import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import authController from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.validator.js";

const authRouter = Router();

authRouter.post('/register', validate(registerSchema), (req, res, next) => authController.registerUser(req, res, next));
authRouter.post('/login', validate(loginSchema), (req, res, next) => authController.loginUser(req, res, next));
authRouter.post('/logout', (req, res, next) => authController.logoutUser(req, res, next));
authRouter.post('/refresh', (req, res, next) => authController.refreshAccessToken(req, res, next));
authRouter.get('/me', authenticate, (req, res, next) => authController.getCurrentUser(req, res, next));

export default authRouter;