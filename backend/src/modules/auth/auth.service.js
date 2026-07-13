import authRepo from "./auth.repository.js";
import { ApiError } from "../../utils/apiError.js";
import { apiResponse } from "../../utils/apiResponse.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { accessTokenSecret, refreshTokenSecret } from "../../config/config.js";

class AuthService {
    async registerUser({ firstName, lastName = "", email, password }) {
        try {
            if (!firstName || !email || !password) {
                throw new ApiError(400, "First name, email, and password are required");
            }

            const existingUser = await authRepo.findUserByEmail(email);
            if (existingUser) {
                throw new ApiError(400, "User with this email already exists");
            }

            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(password, salt);

            const data = {
                firstName,
                lastName,
                email,
                password: hashedPassword,
            };

            const newUser = await authRepo.createUser(data);

            return apiResponse(201, {
                firstName: newUser.firstName,
                email: newUser.email,
            }, "User successfully created");
        } catch (err) {
            if (err instanceof ApiError) {
                throw err;
            }
            throw new ApiError(500, "Internal Server Error during registration");
        }
    }

    async loginUser({ email, password }) {
        try {
            if (!email || !password) {
                throw new ApiError(400, "Email and Password are required");
            }

            const user = await authRepo.findUserByEmail(email);
            if (!user) {
                throw new ApiError(401, "Invalid Credentials");
            }

            const isMatchPassword = await bcrypt.compare(password, user.password);
            if (!isMatchPassword) {
                throw new ApiError(401, "Invalid Credentials");
            }

            const accessToken = this.generateAccessToken(user);
            const refreshToken = this.generateRefreshToken(user);
            const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

            await authRepo.updateUserById(user._id, { refreshToken: refreshTokenHash });

            return { user, accessToken, refreshToken };
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, "Internal Server Error during login");
        }
    }

    async logoutUser(req) {
        try {
            const refreshTokenValue = this.extractRefreshToken(req);
            const accessTokenValue = this.extractAccessToken(req);

            let userId = null;

            if (refreshTokenValue) {
                try {
                    const decodedRefreshToken = jwt.verify(refreshTokenValue, refreshTokenSecret);
                    userId = decodedRefreshToken.sub || decodedRefreshToken.id;
                } catch {
                    userId = null;
                }
            }

            if (!userId && accessTokenValue) {
                try {
                    const decodedAccessToken = jwt.verify(accessTokenValue, accessTokenSecret);
                    userId = decodedAccessToken.sub || decodedAccessToken.id;
                } catch {
                    userId = null;
                }
            }

            if (userId) {
                await authRepo.updateUserById(userId, { refreshToken: null });
            }

            return true;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, "Internal Server Error during logout");
        }
    }

    async refreshAccessToken(req) {
        try {
            const refreshTokenValue = this.extractRefreshToken(req);
            if (!refreshTokenValue) {
                throw new ApiError(401, "Refresh token required");
            }

            let decodedRefreshToken;
            try {
                decodedRefreshToken = jwt.verify(refreshTokenValue, refreshTokenSecret);
            } catch {
                throw new ApiError(401, "Invalid or expired refresh token");
            }

            const user = await authRepo.findUserById(decodedRefreshToken.sub || decodedRefreshToken.id);
            if (!user || !user.refreshToken) {
                throw new ApiError(401, "Session expired. Please login again");
            }

            const isValidRefreshToken = await bcrypt.compare(refreshTokenValue, user.refreshToken);
            if (!isValidRefreshToken) {
                await authRepo.updateUserById(user._id, { refreshToken: null });
                throw new ApiError(401, "Session expired. Please login again");
            }

            const accessToken = this.generateAccessToken(user);
            const newRefreshToken = this.generateRefreshToken(user);
            const refreshTokenHash = await bcrypt.hash(newRefreshToken, 12);

            await authRepo.updateUserById(user._id, { refreshToken: refreshTokenHash });

            return { user, accessToken, refreshToken: newRefreshToken };
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, "Internal Server Error during token refresh");
        }
    }

    generateAccessToken(user) {
        return jwt.sign(
            { sub: user._id, email: user.email },
            accessTokenSecret,
            { expiresIn: "15m" },
        );
    }

    generateRefreshToken(user) {
        return jwt.sign(
            { sub: user._id },
            refreshTokenSecret,
            { expiresIn: "7d" },
        );
    }

    extractAccessToken(req) {
        return req.cookies?.accessToken || req.headers.authorization?.replace(/^Bearer\s+/i, "");
    }

    extractRefreshToken(req) {
        return req.cookies?.refreshToken || req.body?.refreshToken;
    }
}

export default new AuthService();