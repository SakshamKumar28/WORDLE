import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";
import authRepo from "../modules/auth/auth.repository.js";
import { accessTokenSecret } from "../config/config.js";

export const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.headers.authorization?.replace(/^Bearer\s+/i, "");

        if (!token) {
            return next(new ApiError(401, "Authentication required"));
        }

        let decodedToken;
        try {
            decodedToken = jwt.verify(token, accessTokenSecret);
        } catch {
            return next(new ApiError(401, "Invalid or expired access token"));
        }

        const user = await authRepo.findUserById(decodedToken.sub || decodedToken.id);
        if (!user) {
            return next(new ApiError(401, "User not found"));
        }

        req.user = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
        };

        next();
    } catch (error) {
        next(new ApiError(500, "Authentication failed"));
    }
};
