import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 5001;
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/salath';
export const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
export const PLATFORM_ROOT_DOMAIN = process.env.PLATFORM_ROOT_DOMAIN || 'localhost';
