import { z } from "zod";

export const registerSchema = z.object({
    // We nest inside 'body' because Express puts POST data in req.body
    body: z.object({
        firstName: z.string({ required_error: "First name is required" })
                    .trim()
                    .min(2, "First name must be at least 2 characters"),
        
        lastName: z.string().trim().optional(),
        
        email: z.string({ required_error: "Email is required" })
                .email("Invalid email address"),
        
        password: z.string({ required_error: "Password is required" })
                   .min(6, "Password must be at least 6 characters")
                   // You can add regex here for strong passwords later!
    })
});

export const loginSchema = z.object({
    body: z.object({
        email : z.string({required_error : "Email is required"})
        .email("Invalid email address"),

        // We don't need to add min as it's a already created in the register user
        password : z.string({required_error : "Password is required"})
    })
});