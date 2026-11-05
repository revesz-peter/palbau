import { z } from "zod"

// Error messages are keys under contact.errors in messages/*.json.
export const contactSchema = z.object({
  name: z.string().trim().min(2, "name").max(120, "name"),
  email: z.string().trim().max(200, "email").pipe(z.email("email")),
  phone: z
    .string()
    .trim()
    .max(40, "phone")
    .regex(/^[+\d\s()/.-]*$/, "phone"),
  message: z.string().trim().min(10, "message").max(4000, "messageLong"),
  consent: z.boolean().refine((value) => value, "consent"),
})

export type ContactInput = z.infer<typeof contactSchema>

export type ContactErrorKey =
  "name" | "email" | "phone" | "message" | "messageLong" | "consent"
