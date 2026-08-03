import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT
export const MONGODB_URI = process.env.MONGODB_URI 
export const JWT_SECRET = process.env.JWT_SECRET 
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN
export const PLATFORM_ROOT_DOMAIN = process.env.PLATFORM_ROOT_DOMAIN 

export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL 
export const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD
export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY                 
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY                 
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT             

export const TARGET_A_RECORD = process.env.TARGET_A_RECORD                  
export const TARGET_CNAME_RECORD = process.env.TARGET_CNAME_RECORD                

export const VERCEL_AUTH_TOKEN = process.env.VERCEL_AUTH_TOKEN                 
export const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID                 
export const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID 