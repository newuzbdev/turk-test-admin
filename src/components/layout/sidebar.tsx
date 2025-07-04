import { Layout, Menu } from "antd";
import { useLocation, useNavigate } from "react-router";
// import Logo from '../../assets/Logo.svg';
import { useCallback } from "react";
import { getAllRoutesForMenu } from "../../routes/get-all-routes";
import { routerConfig } from "../../routes/router-config";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const items = getAllRoutesForMenu(routerConfig);
  const handleClick = useCallback(
    (item: { key: string }) => {
      navigate(item.key);
    },

    [navigate]
  );

  return (
    <Layout.Sider
      breakpoint="lg"
      collapsedWidth={60}
      width={280}
      className="h-screen flex flex-col"
    >
      <h1
        style={{ color: "red" }}
        className="text-center p-4 text-2xl font-bold"
      >
        TURKTEST
      </h1>

      <Menu
        style={{
          width: "100%",
          backgroundColor: "transparent",
          borderColor: "transparent",
          color: "black",
        }}
        // theme="light"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={items}
        onClick={handleClick}
      />
    </Layout.Sider>
  );
}
