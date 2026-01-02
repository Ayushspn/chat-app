// Centralized runtime configuration for the client
export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || API_BASE;
export const MONGO_URI = process.env.REACT_APP_MONGO_URI || 'mongodb://localhost:27017/chat-app';
