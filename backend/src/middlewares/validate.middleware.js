import { ApiError } from "../utils/apiError.js";

export const validate = (schema) => (req, res, next) => {
    try {
        // Zod's parse method throws an error if validation fails
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        
        // If successful, move to the next function (your controller)
        next();
    } catch (err) {
        // Format the Zod errors into a readable string
        const errorMessage = err.errors.map((e) => e.message).join(", ");
        
        // Pass the error to your global Express error handler
        next(new ApiError(400, errorMessage)); 
    }
};