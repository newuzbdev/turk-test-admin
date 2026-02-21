/**
 * Decodes JWT accessToken from localStorage and returns admin id (sub or id from payload).
 */
export function getAdminIdFromToken(): string | null {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload)) as { sub?: string; id?: string };
    return decoded.sub ?? decoded.id ?? null;
  } catch {
    return null;
  }
}
