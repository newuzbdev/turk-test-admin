import { useContext, type PropsWithChildren } from "react";
import { StyleProvider } from "@ant-design/cssinjs";
import { ConfigProvider, theme } from "antd";
import locale from "antd/locale/uz_UZ";
import { ThemeContext } from "./theme-provider";
import { Toaster } from "react-hot-toast";

export const AntProvider = ({ children }: PropsWithChildren) => {
  const { theme: mode } = useContext(ThemeContext);
  const isDark = mode === "light";

  const primaryColor = isDark ? "#6366F1" : "#4F46E5"; // Indigo shade
  const successColor = isDark ? "#10B981" : "#059669"; // Emerald shade
  const warningColor = isDark ? "#F59E0B" : "#D97706"; // Amber shade
  const errorColor = isDark ? "#EF4444" : "#DC2626"; // Red shade
  const infoColor = isDark ? "#3B82F6" : "#2563EB"; // Blue shade

  // Background colors - Softer, warmer colors for dark mode
  const bgBase = isDark ? "#1a1b23" : "#FFFFFF"; // Softer dark gray
  const bgSecondary = isDark ? "#242530" : "#F9FAFB"; // Slightly lighter secondary
  const bgTertiary = isDark ? "#2d2e3a" : "#F3F4F6"; // Warmer tertiary

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
            headerBg: isDark ? bgSecondary : "#FFFFFF",
            siderBg: isDark ? bgSecondary : "#FFFFFF",
            bodyBg: isDark ? bgBase : "#F9FAFB",
            colorText: isDark ? "#E5E7EB" : "#374151",
            colorTextSecondary: isDark ? "#D1D5DB" : "#4B5563",
          },

          // Table component
          Table: {
            headerBg: isDark ? bgSecondary : "#F9FAFB",
            headerColor: isDark ? "#E5E7EB" : "#374151",
            rowHoverBg: isDark ? bgTertiary : "#F3F4F6",
            rowExpandedBg: isDark ? bgTertiary : "#F3F4F6",
            borderColor: isDark ? bgTertiary : "#E5E7EB",
          },

          // Menu component
          Menu: {
            darkItemSelectedBg: primaryColor,
            darkItemHoverBg: bgTertiary,
            darkSubMenuItemBg: bgSecondary,
            itemSelectedBg: `${primaryColor}15`, // Light opacity version of primary color
            itemHoverBg: isDark ? bgTertiary : "#F3F4F6",
            colorText: isDark ? "#E5E7EB" : "#374151",
            colorTextSecondary: isDark ? "#D1D5DB" : "#4B5563",
          },

          // Button component
          Button: {
            defaultBg: isDark ? bgTertiary : "#F9FAFB",
            defaultColor: isDark ? "#E5E7EB" : "#374151",
            defaultBorderColor: isDark ? "#4B5563" : "#D1D5DB",
            primaryShadow: `0 4px 6px -1px ${primaryColor}20`,
            defaultShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            borderRadius: 6,
            colorPrimaryHover: isDark ? "#818CF8" : "#6366F1", // Lighter indigo for hover
          },

          // Input and Form components
          Input: {
            activeBg: isDark ? bgSecondary : "#FFFFFF",
            activeBorderColor: primaryColor,
            hoverBorderColor: isDark ? "#4B5563" : "#D1D5DB",
            addonBg: isDark ? bgTertiary : "#F3F4F6",
          },

          Form: {
            labelColor: isDark ? "#D1D5DB" : "#374151",
            itemMarginBottom: 20,
          },

          // Card component
          Card: {
            colorBgContainer: isDark ? bgSecondary : "#FFFFFF",
            boxShadow: isDark
              ? "0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px -1px rgba(0, 0, 0, 0.2)"
              : "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
          },

          // Dropdown component
          Dropdown: {
            controlItemBgActive: isDark ? bgTertiary : "#F3F4F6",
            controlItemBgActiveHover: isDark
              ? primaryColor
              : `${primaryColor}20`,
          },

          // Select component
          Select: {
            optionSelectedBg: isDark ? primaryColor : `${primaryColor}20`,
            optionActiveBg: isDark ? bgTertiary : "#F3F4F6",
          },

          // Modal component
          Modal: {
            contentBg: isDark ? bgSecondary : "#FFFFFF",
            headerBg: isDark ? bgSecondary : "#FFFFFF",
            footerBg: isDark ? bgSecondary : "#FFFFFF",
            // maskBg: 'rgba(0, 0, 0, 0.5)'
            titleColor: isDark ? "#FFFFFF" : "#000000",
            colorText: isDark ? "#D1D5DB" : "#374151",
          },

          // Tabs component
          Tabs: {
            inkBarColor: primaryColor,
            itemHoverColor: primaryColor,
            itemSelectedColor: primaryColor,
            cardBg: isDark ? bgSecondary : "#FFFFFF",
            cardGutter: 8,
          },

          // Segmented component
          Segmented: {
            itemSelectedBg: isDark ? primaryColor : `${primaryColor}20`,
            itemHoverBg: isDark ? bgTertiary : "#F3F4F6",
            // bgColor: isDark ? bgSecondary : '#F3F4F6'
          },

          // Switch component
          Switch: {
            handleBg: "#FFFFFF",
            colorPrimary: primaryColor,
          },

          Notification: {
            colorErrorBg: isDark ? bgSecondary : "#FFFFFF",
            colorSuccessBg: isDark ? bgSecondary : "#FFFFFF",
            colorText: isDark ? "#E5E7EB" : "#374151",
          },
        },
      }}
    >
      <StyleProvider>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: isDark ? bgSecondary : "#FFFFFF",
              color: isDark ? "#E5E7EB" : "#374151",
              border: `1px solid ${isDark ? bgTertiary : "#E5E7EB"}`,
            },
          }}
        />
      </StyleProvider>
    </ConfigProvider>
  );
};
