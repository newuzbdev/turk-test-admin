import axios from "axios";
import { api } from ".";
import { authEndpoints } from "./endpoint";

const baseURL = import.meta.env.VITE_API_URL;
const axiosPrivate = axios.create({
  baseURL,
  withCredentials: true,
});

axiosPrivate.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosPrivate.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const refreshResponse = await api.post(authEndpoints.refresh, {
          refreshToken,
        });

        if (refreshResponse?.data?.accessToken) {
          const newAccessToken = refreshResponse.data.accessToken;
          localStorage.setItem("accessToken", newAccessToken);
          if (refreshResponse.data.refreshToken) {
            localStorage.setItem(
              "refreshToken",
              refreshResponse.data.refreshToken
            );
          }
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosPrivate(originalRequest);
        }
      } catch (err) {
        console.error("Error refreshing token:", err);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        // Redirect to login with current location for better UX
        const currentPath = window.location.pathname;
        window.location.href = `/login?redirect=${encodeURIComponent(
          currentPath
        )}`;
        return Promise.reject(err);
      }
    }

    if (
      error.response?.status === 405 &&
      error.response?.data?.message === "Password Change Requierd" &&
      error.response?.data?.error === "Method Not Allowed"
    ) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default axiosPrivate;
