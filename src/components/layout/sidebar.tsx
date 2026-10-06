import { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Dropdown, Modal } from "antd";
import {
  ChevronDown,
  ChevronsUpDown,
  UserRound,
  LogOut,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import { routerConfig } from "../../routes/router-config";
import { ThemeContext } from "../../providers/theme-provider";
import { useAuth } from "../../providers/auth-provider";
import { useAdminLogout } from "../../config/queries/login-querys";

const groups = [
  {
    label: "Sınavlar",
    paths: [
      "test",
      "listening",
      "reading",
      "writing",
      "speaking",
      "official-exams",
    ],
  },
  { label: "Dersler", paths: ["learn", "learn/skill-tags"] },
  {
    label: "Pratik",
    paths: [
      "reading-practice",
      "listening-practice",
      "writing-practice",
      "speaking-practice",
    ],
  },
  {
    label: "Yönetim",
    paths: ["billing-packages", "subscriptions", "product", "test-coin-price", "user-coin", "banner"],
  },
  { label: "Sistem", paths: ["system-services", "ai-costs", "archive"] },
];
const groupStorageKey = "admin-sidebar-groups";
function readClosedGroups(): Record<string, boolean> {
  try {
    const stored = JSON.parse(localStorage.getItem(groupStorageKey) || "{}");
    return stored && typeof stored === "object" && !Array.isArray(stored)
      ? (Object.fromEntries(
          Object.entries(stored).filter(
            ([, value]) => typeof value === "boolean",
          ),
        ) as Record<string, boolean>)
      : {};
  } catch {
    return {};
  }
}
export default function Sidebar({
  collapsed,
  onToggle,
  mobile = false,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
}) {
  const { pathname } = useLocation();
  const { theme, toggleMode } = useContext(ThemeContext);
  const { setAuthenticated } = useAuth();
  const logout = useAdminLogout(setAuthenticated);
  const [confirming, setConfirming] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [closedGroups, setClosedGroups] = useState(readClosedGroups);
  const activePath = routerConfig
    .filter(
      (route) =>
        route.inMenu &&
        (pathname === `/${route.path}` ||
          pathname.startsWith(`/${route.path}/`)),
    )
    .sort((a, b) => b.path.length - a.path.length)[0]?.path;
  useEffect(() => {
    const currentGroup = groups.find((group) =>
      group.paths.includes(activePath || ""),
    );
    if (currentGroup)
      setClosedGroups((previous) => ({
        ...previous,
        [currentGroup.label]: false,
      }));
  }, [activePath]);
  useEffect(() => {
    try {
      localStorage.setItem(groupStorageKey, JSON.stringify(closedGroups));
    } catch {
      /* Navigation also works without storage. */
    }
  }, [closedGroups]);
  return (
    <aside
      className={`admin-sidebar ${collapsed ? "admin-sidebar--collapsed" : ""}`}
      aria-label="Yönetim menüsü"
    >
      <div className="admin-sidebar-top">
        {collapsed ? (
          <button
            className="admin-sidebar-expand"
            type="button"
            onClick={onToggle}
            aria-label="Menüyü genişlet"
            title="Menüyü genişlet"
          >
            <span>TM</span>
            <PanelLeftOpen size={19} />
          </button>
        ) : (
          <>
            <Link
              to="/test"
              className="admin-sidebar-brand"
              aria-label="TurkishMock yönetim ana sayfası"
            >
              <img src="/logo11.svg" alt="TURKISHMOCK" />
            </Link>
            <button
              className="admin-icon-button"
              type="button"
              onClick={onToggle}
              aria-label={mobile ? "Menüyü kapat" : "Menüyü daralt"}
              title={mobile ? "Menüyü kapat" : "Menüyü daralt"}
            >
              <PanelLeftClose size={18} />
            </button>
          </>
        )}
      </div>
      <nav className="admin-sidebar-nav" aria-label="Admin sayfaları">
        {groups.map((group) => (
          <div className="admin-nav-group" key={group.label}>
            {!collapsed && (
              <button
                type="button"
                className="admin-nav-group-toggle"
                aria-expanded={!closedGroups[group.label]}
                aria-controls={`nav-group-${group.paths[0]}`}
                onClick={() =>
                  setClosedGroups((previous) => ({
                    ...previous,
                    [group.label]: !previous[group.label],
                  }))
                }
              >
                <span>{group.label}</span>
                <ChevronDown size={14} aria-hidden="true" />
              </button>
            )}
            <div
              id={`nav-group-${group.paths[0]}`}
              hidden={!collapsed && closedGroups[group.label]}
            >
              {group.paths.map((path) => {
                const item = routerConfig.find((route) => route.path === path);
                if (!item) return null;
                return (
                  <Link
                    key={path}
                    to={`/${path}`}
                    title={collapsed ? item.label : undefined}
                    aria-label={item.label}
                    aria-current={activePath === path ? "page" : undefined}
                    className={`admin-nav-link ${activePath === path ? "is-active" : ""}`}
                  >
                    <span className="admin-nav-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="admin-sidebar-controls">
        <Dropdown
          trigger={["click"]}
          placement={collapsed ? "topRight" : "topLeft"}
          open={profileOpen}
          onOpenChange={setProfileOpen}
          overlayClassName="admin-profile-dropdown"
          menu={{
            items: [
              {
                key: "profile",
                label: <Link to="/profile">Hesap ayarları</Link>,
                icon: <Settings size={16} />,
              },
              {
                key: "theme",
                label: theme === "dark" ? "Açık tema" : "Koyu tema",
                icon: theme === "dark" ? <Sun size={16} /> : <Moon size={16} />,
              },
              { type: "divider" },
              {
                key: "logout",
                label: "Çıkış yap",
                icon: <LogOut size={16} />,
                danger: true,
              },
            ],
            onClick: ({ key }) => {
              setProfileOpen(false);
              if (key === "theme") toggleMode();
              if (key === "logout") setConfirming(true);
            },
          }}
        >
          <button
            type="button"
            className="admin-profile-trigger"
            aria-label="Yönetici menüsü"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            title={collapsed ? "Yönetici" : undefined}
          >
            <span className="admin-profile-avatar">
              <UserRound size={17} aria-hidden="true" />
            </span>
            {!collapsed && (
              <>
                <span>Yönetici</span>
                <ChevronsUpDown size={15} aria-hidden="true" />
              </>
            )}
          </button>
        </Dropdown>
      </div>
      <Modal
        open={confirming}
        title="Çıkış yapılsın mı?"
        okText="Çıkış yap"
        cancelText="Vazgeç"
        confirmLoading={logout.isPending}
        onCancel={() => setConfirming(false)}
        onOk={() => logout.mutate()}
      >
        <p>Yönetim oturumun kapatılacak.</p>
      </Modal>
    </aside>
  );
}
