import axios from "axios";
import { api } from ".";
import { authEndpoints } from "./endpoint";

const baseURL = import.meta.env.VITE_API_URL || "https://api.turkishmock.uz";
const axiosPrivate = axios.create({ baseURL });
const requestSessions = new WeakMap<object, string | null>();
let renewal: { token: string; promise: Promise<string> } | null = null;

function requireLogin() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  const returnTo = window.location.pathname + window.location.search + window.location.hash;
  window.location.href = `/login?redirect=${encodeURIComponent(returnTo)}`;
}

function renewAccessToken(refreshToken: string): Promise<string> {
  if (renewal?.token === refreshToken) return renewal.promise;
  const promise = (async () => {
    try {
      const { data } = await api.post(authEndpoints.refresh, { refreshToken }, {
        timeout: 10_000, withCredentials: false,
      });
      if (localStorage.getItem("refreshToken") !== refreshToken) {
        throw new Error("Oturum değişti. İsteği yeniden deneyin.");
      }
      if (typeof data?.accessToken !== "string" || !data.accessToken) {
        throw new Error("Oturum yenileme yanıtı eksik.");
      }
      localStorage.setItem("accessToken", data.accessToken);
      if (typeof data.refreshToken === "string" && data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      return data.accessToken as string;
    } catch (error) {
      if (localStorage.getItem("refreshToken") !== refreshToken) {
        throw new Error("Oturum değişti. İsteği yeniden deneyin.");
      }
      // Only a confirmed rejection invalidates login. Network/5xx keeps it.
      if (axios.isAxiosError(error) && error.response?.status === 401) requireLogin();
      throw error;
    }
  })();
  renewal = { token: refreshToken, promise };
  void promise.finally(() => {
    if (renewal?.promise === promise) renewal = null;
  }).catch(() => undefined);
  return promise;
}

axiosPrivate.interceptors.request.use((config) => {
  requestSessions.set(config, localStorage.getItem("refreshToken"));
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosPrivate.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config;
    if (error.response?.status !== 401 || !original) return Promise.reject(error);
    const refreshToken = localStorage.getItem("refreshToken");
    if (requestSessions.get(original) !== refreshToken) {
      return Promise.reject(new Error("Oturum değişti. İsteği yeniden deneyin."));
    }
    if (original._retry || !refreshToken) {
      requireLogin();
      return Promise.reject(error);
    }
    original._retry = true;
    // Another request may already have renewed the token that was rejected.
    const current = localStorage.getItem("accessToken");
    const token = current && original.headers.Authorization !== `Bearer ${current}`
      ? current : await renewAccessToken(refreshToken);
    original.headers.Authorization = `Bearer ${token}`;
    return axiosPrivate(original);
  },
);

export default axiosPrivate;
