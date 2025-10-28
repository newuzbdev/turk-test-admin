import axios from 'axios';

// Base API instance without interceptors (for login/refresh)
const baseURL = import.meta.env.VITE_API_URL || 'https://api.turkishmock.uz';
export const api = axios.create({
	baseURL,
});
