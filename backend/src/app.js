import express from "express";
import cors from "cors"; 
import authRoutes from "./modules/auth/auth.route.js";
import limiter from "./utils/rateLimiter.js";

// Initialization of Express Server
const app = express();

/**
 * Global MiddleWares
 */
// Allows your frontend to communicate with this backend securely
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true
}));

app.use(express.json());
// Good practice to include this alongside express.json() for form submissions
app.use(express.urlencoded({ extended: true })); 

// Health Check route
app.get('/health', (req, res) => {
    res.status(200).json({ message: "Server is Healthy", status: 200 });
});

/**
 * @describe Authentication Routes
 */
// I added /v1/ here! It's a great habit to version your APIs right from the start.
app.use('/api/v1/auth', limiter, authRoutes);

/**
 * @describe Global Error Handling Middleware
 * IMPORTANT: This must be the absolute LAST middleware in this file!
 */
app.use((err, req, res, next) => {
    // Extract the status code and message from our custom ApiError, or default to 500
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message: message,
        // Optional: Only send the messy stack trace when you are in development mode!
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
});

export default app;