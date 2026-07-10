import authService from "./auth.service.js";

class AuthController {
    // 1. Added 'next' to the parameters
    async registerUser(req, res, next) {
        try {
            // 2. Await the service and capture the formatted response
            const response = await authService.registerUser(req.body);

            // 3. Send it back to the client using the Express 'res' object
            res.status(response.status).json(response);

        } catch (error) {
            // 4. Catch any errors (like the ApiError from the service) 
            next(error);
        }
    }

    async loginUser(req, res, next) {
        try {
            // 1. Get tokens from the service
            const { user, accessToken, refreshToken } = await authService.loginUser(req.body);

            // 2. Define secure cookie options
            const cookieOptions = {
                httpOnly: true, // Prevents JavaScript (XSS) from reading the cookie
                secure: process.env.NODE_ENV === "production", // Requires HTTPS in production
                sameSite: "strict", // Prevents CSRF attacks
            };

            // 3. Attach cookies to the response
            res.cookie("accessToken", accessToken, {
                ...cookieOptions,
                maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
            });

            res.cookie("refreshToken", refreshToken, {
                ...cookieOptions,
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
            });

            // 4. Send the sanitized user data
            const response = apiResponse(200, {
                id: user._id,
                firstName: user.firstName,
                email: user.email
            }, "Login successful");

            res.status(200).json(response);

        } catch (error) {
            next(error);
        }
    }
}

// Export a single instance of the controller
export default new AuthController();