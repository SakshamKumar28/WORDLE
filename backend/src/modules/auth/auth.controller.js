import authService from "./auth.service.js";
import { apiResponse } from "../../utils/apiResponse.js";

class AuthController {
    constructor() {
        this.registerUser = this.registerUser.bind(this);
        this.loginUser = this.loginUser.bind(this);
        this.logoutUser = this.logoutUser.bind(this);
        this.getCurrentUser = this.getCurrentUser.bind(this);
        this.refreshAccessToken = this.refreshAccessToken.bind(this);
    }

    async registerUser(req, res, next) {
        try {
            const response = await authService.registerUser(req.body);
            res.status(response.status).json(response);
        } catch (error) {
            next(error);
        }
    }

    async loginUser(req, res, next) {
        try {
            const { user, accessToken, refreshToken } = await authService.loginUser(req.body);
            this.setAuthCookies(res, accessToken, refreshToken);

            const response = apiResponse(200, {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                },
            }, "Login successful");

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    async logoutUser(req, res, next) {
        try {
            await authService.logoutUser(req);
            this.clearAuthCookies(res);
            res.status(200).json(apiResponse(200, null, "Logout successful"));
        } catch (error) {
            next(error);
        }
    }

    async getCurrentUser(req, res, next) {
        try {
            res.status(200).json(apiResponse(200, {
                user: req.user,
            }, "User fetched successfully"));
        } catch (error) {
            next(error);
        }
    }

    async refreshAccessToken(req, res, next) {
        try {
            const { user, accessToken, refreshToken } = await authService.refreshAccessToken(req);
            this.setAuthCookies(res, accessToken, refreshToken);

            res.status(200).json(apiResponse(200, {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                },
            }, "Token refreshed successfully"));
        } catch (error) {
            next(error);
        }
    }

    setAuthCookies(res, accessToken, refreshToken) {
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        };

        res.cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
    }

    clearAuthCookies(res) {
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        };

        res.clearCookie("accessToken", cookieOptions);
        res.clearCookie("refreshToken", cookieOptions);
    }
}

export default new AuthController();