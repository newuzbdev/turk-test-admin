// import avatar from '../../assets/avatar.png';
import { Layout, Typography, Modal } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router";
import { routerConfig, type RouterConfig } from "../../routes/router-config";
import ThemeSwitcher from "../ui/theme-switcher";
import { DoorOpen } from "lucide-react";
import { useAdminLogout } from "../../config/queries/login-querys";
import { useAuth } from "../../providers/auth-provider";

export default function Header() {
  const location = useLocation();
  const [name, setName] = useState("");
  const { setAuthenticated } = useAuth();
  const { mutate: logout } = useAdminLogout(setAuthenticated);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const findTitle = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (list: RouterConfig[], parentPath: string): any => {
      for (const route of list) {
        const currentPath = parentPath + "/" + route.path;
        if (location.pathname === currentPath) {
          return route.title;
        } else if (route.children) {
          const childTitle = findTitle(route.children, currentPath);
          if (childTitle) return childTitle;
        }
      }
      return undefined;
    },
    [location.pathname]
  );

  useEffect(() => {
    const title = findTitle(routerConfig, "");
    if (title) {
      setName(title);
    } else {
      setName("");
    }
  }, [location.pathname, findTitle]);

  const handleClick = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    logout();
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <Layout.Header className="flex justify-between items-center">
      <Typography.Title>{name}</Typography.Title>
      <div className="flex items-center gap-3 justify-center">
        <ThemeSwitcher />
        <button
          onClick={handleClick}
          className="hover:cursor-pointer text-red-600 p-2 rounded-md "
        >
          {/* Log Out */}
          <DoorOpen />
        </button>
        <Modal
          title="Logout Confirmation"
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          okText="Ha"
          cancelText="Yo'q"
        >
          <p>Ishonchingiz komilmi?</p>
        </Modal>
        {/* <Avatar alt='avatar' shape='circle' size={48} src={avatar} /> */}
      </div>
    </Layout.Header>
  );
}
