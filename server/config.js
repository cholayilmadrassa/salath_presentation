import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT
export const MONGODB_URI = process.env.MONGODB_URI 
export const JWT_SECRET = process.env.JWT_SECRET 
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN
export const PLATFORM_ROOT_DOMAIN = process.env.PLATFORM_ROOT_DOMAIN 

export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL 
export const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD

export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BGiWMbxl3_s_U1T2_yS-csp-msS0wttV_M5rSDD6X0XeisiqDKYr5f9sOk7kMCXUjaHi-lVIrmlM75a8bb-aXII';
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'Yp0dsNsFyDQ3EGBVMp7e93HAGGgdzgBXg79Hd0ym18c';
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@swalath.online';