import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT
export const MONGODB_URI = process.env.MONGODB_URI 
export const JWT_SECRET = process.env.JWT_SECRET 
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN
export const PLATFORM_ROOT_DOMAIN = process.env.PLATFORM_ROOT_DOMAIN 

export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL 
export const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD