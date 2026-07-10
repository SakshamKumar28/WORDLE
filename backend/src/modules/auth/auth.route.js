import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import authController from "./auth.controller.js";
import { registerSchema } from "./auth.validator.js";

const authRouter = Router();

authRouter.post('/register',validate(registerSchema), authController.registerUser);

export default authRouter;