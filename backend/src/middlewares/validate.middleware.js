import { ApiError } from "../utils/apiError.js";

export const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        next();
    } catch (err) {
        const details = err?.issues?.map((issue) => issue.message).join(", ") || "Validation failed";
        next(new ApiError(400, details));
    }
};