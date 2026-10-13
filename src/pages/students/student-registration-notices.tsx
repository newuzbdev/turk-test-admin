import { useEffect, useState } from "react";
import { Switch } from "antd";
import { Bell, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAccessConfig } from "@/config/queries/access";
import {
  adminAccountRequest,
  useSubscriptionAdminId,
} from "./student-subscription-query";
import { currentAdminId, useDocumentVisible } from "./student-live-query";
import {
  RegistrationTracker,
  type Registration,
} from "./student-registration-tracker";
import "./students.css";
const preferenceEvent = "admin:registration-notices";
const key = (id: string) => `admin-registration-notices:${id}`;
function enabledFor(id: string) {
  try {
    return !!id && localStorage.getItem(key(id)) !== "off";
  } catch {
    return !!id;
  }
}
function usePreference(id: string) {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const update = () => setRevision((r) => r + 1);
    window.addEventListener(preferenceEvent, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(preferenceEvent, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  void revision;
  return enabledFor(id);
}
export function NewStudentNoticeToggle() {
  const id = useSubscriptionAdminId(),
    enabled = usePreference(id);
  return (
    <label className="student-notice-setting">
      <Switch
        size="small"
        disabled={!id}
        checked={enabled}
        aria-label="Yeni kayıt bildirimleri"
        onChange={(value) => {
          try {
            localStorage.setItem(key(id), value ? "on" : "off");
          } catch {
            /* Session preference may be unavailable. */
          }
          window.dispatchEvent(new Event(preferenceEvent));
        }}
      />
      <span>Yeni kayıt bildirimi</span>
    </label>
  );
}
export default function StudentRegistrationNotices() {
  const id = useSubscriptionAdminId();
  return id ? <RegistrationNoticesForAdmin key={id} adminId={id} /> : null;
}
function RegistrationNoticesForAdmin({ adminId }: { adminId: string }) {
  const config = useAccessConfig(),
    enabled = usePreference(adminId),
    visible = useDocumentVisible();
  const [notice, setNotice] = useState<{
    owner: string;
    rows: Registration[];
  } | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const clearDisabledNotice = () => {
      if (!enabledFor(adminId)) setNotice(null);
    };
    window.addEventListener(preferenceEvent, clearDisabledNotice);
    window.addEventListener("storage", clearDisabledNotice);
    return () => {
      window.removeEventListener(preferenceEvent, clearDisabledNotice);
      window.removeEventListener("storage", clearDisabledNotice);
    };
  }, [adminId]);
  useEffect(() => {
    if (!enabled || !config.data?.enabled) return;
    // The first successful fetch is a baseline, not a burst of old registrations.
    const tracker = new RegistrationTracker();
    let stopped = false;
    let flight: AbortController | undefined;
    async function poll() {
      if (
        stopped ||
        flight ||
        document.visibilityState === "hidden" ||
        currentAdminId() !== adminId
      )
        return;
      const controller = new AbortController();
      flight = controller;
      const timeout = window.setTimeout(() => controller.abort(), 5000);
      try {
        const result = await adminAccountRequest<{
          success: boolean;
          data: { items: Registration[] };
        }>(
          "get",
          "/api/admin/students",
          adminId,
          undefined,
          controller.signal,
          { page: 1, limit: 25, order: "NEWEST" },
        );
        if (
          stopped ||
          controller.signal.aborted ||
          currentAdminId() !== adminId ||
          !result.success
        )
          return;
        const arrivals = tracker.observe(result.data.items);
        if (arrivals.length) setNotice({ owner: adminId, rows: arrivals });
      } catch {
        /* The next scheduled check retries; no inaccurate offline alerts. */
      } finally {
        window.clearTimeout(timeout);
        if (flight === controller) flight = undefined;
      }
    }
    void poll();
    const timer = window.setInterval(() => void poll(), 20000);
    const onVisible = () => {
      if (document.visibilityState !== "hidden") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      flight?.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [adminId, enabled, config.data?.enabled]);
  if (
    !enabled ||
    !config.data?.enabled ||
    !visible ||
    notice?.owner !== adminId ||
    currentAdminId() !== adminId
  )
    return null;
  const single = notice.rows.length === 1;
  return (
    <aside
      className="student-registration-toast"
      role="status"
      aria-live="polite"
    >
      <Bell size={18} aria-hidden="true" />
      <div>
        <strong>
          {single
            ? `${notice.rows[0].name || "Yeni öğrenci"} katıldı`
            : `${notice.rows.length} yeni öğrenci katıldı`}
        </strong>
        <button
          type="button"
          className="student-notice-link"
          onClick={() => {
            navigate(single ? `/students/${notice.rows[0].id}` : "/students");
            setNotice(null);
          }}
        >
          Öğrenciyi görüntüle
        </button>
      </div>
      <button
        type="button"
        className="student-notice-close"
        aria-label="Yeni kayıt bildirimini kapat"
        onClick={() => setNotice(null)}
      >
        <X size={16} />
      </button>
    </aside>
  );
}
