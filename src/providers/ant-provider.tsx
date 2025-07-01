import { useContext, type PropsWithChildren } from "react";
import { StyleProvider } from "@ant-design/cssinjs";
import { ConfigProvider, notification, theme } from "antd";
import locale from "antd/locale/uz_UZ";
import { ThemeContext } from "./theme-provider";

export const AntProvider = ({ children }: PropsWithChildren) => {
  const { theme: mode } = useContext(ThemeContext);
  const isDark = mode === "light";

  notification.config({
    placement: "bottomRight",
    duration: 4,
  });

  const primaryColor = isDark ? "#6366F1" : "#4F46E5"; // Indigo shade
  const successColor = isDark ? "#10B981" : "#059669"; // Emerald shade
  const warningColor = isDark ? "#F59E0B" : "#D97706"; // Amber shade
  const errorColor = isDark ? "#EF4444" : "#DC2626"; // Red shade
  const infoColor = isDark ? "#3B82F6" : "#2563EB"; // Blue shade

  // Background colors
  const bgBase = isDark ? "#1E1F2E" : "#FFFFFF";
  // const bgSecondary = isDark ? '#282A3F' : '#F9FAFB'
  // const bgTertiary = isDark ? '#363850' : '#F3F4F6'

  return (
    <ConfigProvider
      locale={locale}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: primaryColor,
          colorSuccess: successColor,
          colorWarning: warningColor,
          colorError: errorColor,
          colorInfo: infoColor,
          colorBgBase: bgBase,
          borderRadius: 6,

          // Font settings
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",

          // Control the overall component spacing
          marginXS: 8,
          marginSM: 12,
          marginMD: 16,
          marginLG: 24,
          marginXL: 32,

          // Control sizes
          controlHeight: 38,
        },
        components: {
          // Layout components
          Layout: {
            headerBg: isDark ? "#282A3F" : "#FFFFFF",
            siderBg: isDark ? "#282A3F" : "#FFFFFF",
            bodyBg: isDark ? "#1E1F2E" : "#F9FAFB",
            colorText: isDark ? "#E5E7EB" : "#374151",
            colorTextSecondary: isDark ? "#D1D5DB" : "#4B5563",
          },

          // Table component
          Table: {
            headerBg: isDark ? "#282A3F" : "#F9FAFB",
            headerColor: isDark ? "#E5E7EB" : "#374151",
            rowHoverBg: isDark ? "#363850" : "#F3F4F6",
            rowExpandedBg: isDark ? "#363850" : "#F3F4F6",
            borderColor: isDark ? "#363850" : "#E5E7EB",
          },

          // Menu component
          Menu: {
            darkItemSelectedBg: primaryColor,
            darkItemHoverBg: "#363850",
            darkSubMenuItemBg: "#242638",
            itemSelectedBg: `${primaryColor}15`, // Light opacity version of primary color
            itemHoverBg: isDark ? "#363850" : "#F3F4F6",
            colorText: isDark ? "#E5E7EB" : "#374151",
            colorTextSecondary: isDark ? "#D1D5DB" : "#4B5563",
          },

          // Button component
          Button: {
            defaultBg: isDark ? "#363850" : "#F9FAFB",
            defaultColor: isDark ? "#E5E7EB" : "#374151",
            defaultBorderColor: isDark ? "#4B5563" : "#D1D5DB",
            primaryShadow: `0 4px 6px -1px ${primaryColor}20`,
            defaultShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            borderRadius: 6,
            colorPrimaryHover: isDark ? "#818CF8" : "#6366F1", // Lighter indigo for hover
          },

          // Input and Form components
          Input: {
            activeBg: isDark ? "#242638" : "#FFFFFF",
            activeBorderColor: primaryColor,
            hoverBorderColor: isDark ? "#4B5563" : "#D1D5DB",
            addonBg: isDark ? "#363850" : "#F3F4F6",
          },

          Form: {
            labelColor: isDark ? "#D1D5DB" : "#374151",
            itemMarginBottom: 20,
          },

          // Card component
          Card: {
            colorBgContainer: isDark ? "#282A3F" : "#FFFFFF",
            boxShadow: isDark
              ? "0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)"
              : "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
          },

          // Dropdown component
          Dropdown: {
            controlItemBgActive: isDark ? "#363850" : "#F3F4F6",
            controlItemBgActiveHover: isDark
              ? primaryColor
              : `${primaryColor}20`,
          },

          // Select component
          Select: {
            optionSelectedBg: isDark ? primaryColor : `${primaryColor}20`,
            optionActiveBg: isDark ? "#363850" : "#F3F4F6",
          },

          // Modal component
          Modal: {
            contentBg: isDark ? "#282A3F" : "#FFFFFF",
            headerBg: isDark ? "#282A3F" : "#FFFFFF",
            footerBg: isDark ? "#282A3F" : "#FFFFFF",
            // maskBg: 'rgba(0, 0, 0, 0.5)'
            titleColor: isDark ? "#FFFFFF" : "#000000",
            colorText: isDark ? "#D1D5DB" : "#374151",
          },

          // Tabs component
          Tabs: {
            inkBarColor: primaryColor,
            itemHoverColor: primaryColor,
            itemSelectedColor: primaryColor,
            cardBg: isDark ? "#282A3F" : "#FFFFFF",
            cardGutter: 8,
          },

          // Segmented component
          Segmented: {
            itemSelectedBg: isDark ? primaryColor : `${primaryColor}20`,
            itemHoverBg: isDark ? "#363850" : "#F3F4F6",
            // bgColor: isDark ? '#282A3F' : '#F3F4F6'
          },

          // Switch component
          Switch: {
            handleBg: "#FFFFFF",
            colorPrimary: primaryColor,
          },

          Notification: {
            colorErrorBg: isDark ? "#282A3F" : "#FFFFFF",
            colorSuccessBg: isDark ? "#282A3F" : "#FFFFFF",
            colorText: isDark ? "#282A3F" : "#FFFFFF",
          },
        },
      }}
    >
      <StyleProvider>{children}</StyleProvider>
    </ConfigProvider>
  );
};
