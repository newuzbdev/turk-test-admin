import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Drawer } from "antd";
import { PanelLeftOpen } from "lucide-react";
import StudentRegistrationNotices from "@/pages/students/student-registration-notices";
import Sidebar from "./sidebar";

export default function RootLayout() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("admin-sidebar-collapsed") === "true",
  );
  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width: 900px)").matches,
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);
  const toggle = () =>
    setCollapsed((value) => {
      localStorage.setItem("admin-sidebar-collapsed", String(!value));
      return !value;
    });

  return (
    <div className={`admin-shell ${collapsed ? "admin-shell--collapsed" : ""}`}>
      <a href="#admin-workspace" className="admin-skip-link">
        İçeriğe geç
      </a>
      {!mobile && <Sidebar collapsed={collapsed} onToggle={toggle} />}
      {mobile && (
        <>
          <div className="admin-mobile-header">
            <button
              type="button"
              className="admin-icon-button"
              onClick={() => setMobileOpen(true)}
              aria-label="Menüyü aç"
              aria-expanded={mobileOpen}
            >
              <PanelLeftOpen size={20} />
            </button>
            <img src="/logo11.svg" alt="TURKISHMOCK" />
          </div>
          <Drawer
            placement="left"
            width={270}
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            closable={false}
            styles={{ body: { padding: 0 } }}
          >
            <Sidebar
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
              mobile
            />
          </Drawer>
        </>
      )}
      <StudentRegistrationNotices />
      <div className="admin-main">
        <div id="admin-workspace" tabIndex={-1} className="admin-content">
          <div className="admin-content-inner">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
