import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().trim().min(3, { message: "Full name must be at least 3 characters" }),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, { message: "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9" }),
  place: z.string().trim().min(2, { message: "Place / Mahallu must be at least 2 characters" }),
  tenantSlug: z.string().min(1, { message: "Please select an event portal" }),
});

export const loginSchema = z.object({
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, { message: "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9" }),
  tenantSlug: z.string().min(1, { message: "Please select an event portal" }),
});

export const eventTeamRegisterSchema = z.object({
  name: z.string().trim().min(3, { message: "Event/Organization name must be at least 3 characters" }),
  slug: z
    .string()
    .trim()
    .min(3, { message: "Subdomain slug must be at least 3 characters" })
    .regex(/^[a-z0-9-]+$/, { message: "Slug must contain only lowercase letters, numbers, and hyphens" }),
  adminName: z.string().trim().min(2, { message: "Please enter admin name" }),
  adminEmail: z.string().trim().email({ message: "Please enter a valid email address" }),
  adminPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const superAdminTenantSchema = z.object({
  name: z.string().trim().min(3, { message: "Event/Organization name must be at least 3 characters" }),
  slug: z
    .string()
    .trim()
    .min(3, { message: "Subdomain slug must be at least 3 characters" })
    .regex(/^[a-z0-9-]+$/, { message: "Slug must contain only lowercase letters, numbers, and hyphens" }),
  adminName: z.string().trim().min(2, { message: "Please enter admin name" }),
  email: z.string().trim().email({ message: "Please enter a valid admin email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const salathCountSchema = z.object({
  value: z
    .number({ invalid_type_error: "Please enter a valid count number" })
    .min(1, { message: "Count must be at least 1" })
    .max(100000, { message: "Single entry count cannot exceed 100,000 (1 Lakh)" }),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().min(1, { message: "Email is required" }).email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const brandingSchema = z.object({
  title: z.string().trim().min(2, { message: "Event title must be at least 2 characters" }),
  tagline: z.string().optional(),
  logoUrl: z.union([z.string().url({ message: "Please enter a valid URL" }), z.literal('')]).optional(),
  themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: "Please enter a valid hex color (e.g. #4f46e5)" }),
});

export const customDomainSchema = z.object({
  domain: z
    .string()
    .trim()
    .min(4, { message: "Domain must be at least 4 characters" })
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/, {
      message: "Please enter a valid domain (e.g. event.myorganization.org)",
    }),
});
