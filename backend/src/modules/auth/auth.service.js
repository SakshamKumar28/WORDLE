import authRepo from "./auth.repository.js";
import { ApiError } from "../../utils/apiError.js";
import { apiResponse } from "../../utils/apiResponse.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { accessToken, refreshToken } from "../../config/config.js";

class AuthService {
    async registerUser({ firstName, lastName = "", email, password }) {
        try {
            // 1. Basic Validation
            if (!firstName || !email || !password) {
                throw new ApiError(400, "First name, email, and password are required");
            }

            // 2. Check for existing user (Added await)
            const existingUser = await authRepo.findUserByEmail({ email });
            if (existingUser) {
                throw new ApiError(400, "User with this email already exists");
            }

            // 3. Hash Password
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(password, salt);

            const data = {
                firstName,
                lastName,
                email,
                password: hashedPassword
            };

            // 4. Create User (Added await and fixed method name)
            const newUser = await authRepo.createUser(data);

            // 5. Return the formatted response (Fixed object syntax)
            return apiResponse(201, { 
                firstName: newUser.firstName, 
                email: newUser.email 
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

            const user = await authRepo.findUserByEmail({ email });
            // Using 401 for both missing user and bad password prevents email enumeration
            if (!user) {
                throw new ApiError(401, "Invalid Credentials");
            }

            const isMatchPassword = await bcrypt.compare(password, user.password);
            if (!isMatchPassword) {
                throw new ApiError(401, "Invalid Credentials");
            }

            // Fixed object shorthand syntax and used environment variables
            const accessToken = jwt.sign(
                { email: user.email, id: user._id }, 
                process.env.ACCESS_TOKEN_SECRET, 
                { expiresIn: '15m' }
            );

            const refreshToken = jwt.sign(
                { email: user.email, id: user._id }, 
                process.env.REFRESH_TOKEN_SECRET, 
                { expiresIn: '7d' }
            );

            // Return the tokens and user data back to the controller
            return { user, accessToken, refreshToken };

        } catch (error) { // Fixed 'err' to 'error'
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, "Internal Server Error during login"); // Fixed message
        }
    }
}

export default new AuthService();