import { useContext, type PropsWithChildren } from "react";
import { StyleProvider } from "@ant-design/cssinjs";
import { ConfigProvider, theme } from "antd";
import locale from "antd/locale/tr_TR";
import { Toaster } from "react-hot-toast";
import { ThemeContext } from "./theme-provider";

export const AntProvider = ({ children }: PropsWithChildren) => {
  const { theme: mode } = useContext(ThemeContext);
  const isDark = mode === "dark";

  const primaryColor = "#dc2626";
  const primaryHoverColor = "#b91c1c";
  const bgBase = isDark ? "#191919" : "#ffffff";
  const bgSecondary = isDark ? "#202020" : "#fbfbfa";
  const bgTertiary = isDark ? "#292929" : "#f1f1ef";
  const textPrimary = isDark ? "#f2f2f0" : "#37352f";
  const textSecondary = isDark
    ? "rgba(242, 242, 240, 0.68)"
    : "rgba(55, 53, 47, 0.68)";
  const borderColor = isDark
    ? "rgba(255, 255, 255, 0.13)"
    : "rgba(55, 53, 47, 0.14)";

  return (
    <ConfigProvider
      locale={locale}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: primaryColor,
          colorPrimaryHover: primaryHoverColor,
          colorSuccess: "#238636",
          colorWarning: "#c47f00",
          colorError: "#dc2626",
          colorInfo: "#737373",
          colorBgBase: bgBase,
          colorBgLayout: bgSecondary,
          colorBgContainer: isDark ? "#202020" : "#ffffff",
          colorBgElevated: isDark ? "#252525" : "#ffffff",
          colorText: textPrimary,
          colorTextSecondary: textSecondary,
          colorBorder: borderColor,
          colorBorderSecondary: borderColor,
          borderRadius: 6,
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          marginXS: 8,
          marginSM: 12,
          marginMD: 16,
          marginLG: 24,
          marginXL: 32,
          controlHeight: 38,
          controlOutline: "rgba(55, 53, 47, 0.12)",
          boxShadowSecondary: "0 8px 30px rgba(15, 15, 15, 0.08)",
        },
        components: {
          Layout: {
            headerBg: isDark ? bgSecondary : "#ffffff",
            siderBg: isDark ? bgSecondary : "#f7f7f5",
            bodyBg: bgSecondary,
            colorText: textPrimary,
            colorTextSecondary: textSecondary,
          },
          Table: {
            headerBg: isDark ? bgTertiary : "#fbfbfa",
            headerColor: textSecondary,
            rowHoverBg: isDark
              ? bgTertiary
              : "rgba(55, 53, 47, 0.045)",
            rowExpandedBg: bgTertiary,
            borderColor,
            headerBorderRadius: 0,
            cellPaddingBlock: 13,
            cellPaddingInline: 16,
          },
          Menu: {
            itemBg: "transparent",
            subMenuItemBg: "transparent",
            itemColor: textSecondary,
            itemSelectedColor: textPrimary,
            itemSelectedBg: isDark
              ? "rgba(255, 255, 255, 0.09)"
              : "rgba(55, 53, 47, 0.09)",
            itemHoverColor: textPrimary,
            itemHoverBg: isDark
              ? "rgba(255, 255, 255, 0.06)"
              : "rgba(55, 53, 47, 0.06)",
            itemBorderRadius: 5,
            itemHeight: 40,
            darkItemSelectedBg: "rgba(255, 255, 255, 0.09)",
            darkItemHoverBg: bgTertiary,
            darkSubMenuItemBg: bgSecondary,
          },
          Button: {
            defaultBg: isDark ? bgTertiary : "#ffffff",
            defaultColor: textPrimary,
            defaultBorderColor: borderColor,
            primaryShadow: "none",
            defaultShadow: "none",
            borderRadius: 6,
            colorPrimaryHover: primaryHoverColor,
            fontWeight: 600,
          },
          Input: {
            activeBg: isDark ? bgSecondary : "#ffffff",
            activeBorderColor: textPrimary,
            hoverBorderColor: isDark
              ? "rgba(255, 255, 255, 0.24)"
              : "rgba(55, 53, 47, 0.28)",
            addonBg: bgTertiary,
            paddingBlock: 8,
            paddingInline: 11,
          },
          Form: {
            labelColor: textPrimary,
            itemMarginBottom: 18,
            verticalLabelPadding: "0 0 6px",
          },
          Card: {
            colorBgContainer: isDark ? bgSecondary : "#ffffff",
            boxShadow: "none",
            headerBg: "transparent",
          },
          Dropdown: {
            controlItemBgActive: bgTertiary,
            controlItemBgActiveHover: bgTertiary,
          },
          Select: {
            optionSelectedBg: isDark
              ? "rgba(255, 255, 255, 0.09)"
              : "rgba(55, 53, 47, 0.09)",
            optionActiveBg: bgTertiary,
            optionSelectedColor: textPrimary,
          },
          Modal: {
            contentBg: isDark ? bgSecondary : "#ffffff",
            headerBg: isDark ? bgSecondary : "#ffffff",
            footerBg: isDark ? bgSecondary : "#ffffff",
            titleColor: textPrimary,
            colorText: textPrimary,
            borderRadiusLG: 8,
          },
          Tabs: {
            inkBarColor: primaryColor,
            itemHoverColor: primaryColor,
            itemSelectedColor: primaryColor,
            cardBg: isDark ? bgSecondary : "#ffffff",
            cardGutter: 8,
          },
          Segmented: {
            itemSelectedBg: isDark ? "#383838" : "#ffffff",
            itemHoverBg: bgTertiary,
            trackBg: bgTertiary,
          },
          Switch: {
            handleBg: "#ffffff",
            colorPrimary: primaryColor,
          },
          Pagination: {
            itemActiveBg: isDark ? bgTertiary : "#ffffff",
            itemBg: "transparent",
          },
          Descriptions: {
            labelBg: bgTertiary,
            titleColor: textPrimary,
          },
          Notification: {
            colorErrorBg: isDark ? bgSecondary : "#ffffff",
            colorSuccessBg: isDark ? bgSecondary : "#ffffff",
            colorText: textPrimary,
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
              background: isDark ? bgSecondary : "#ffffff",
              color: textPrimary,
              border: `1px solid ${borderColor}`,
              borderRadius: 6,
              boxShadow: "0 8px 30px rgba(15, 15, 15, 0.08)",
            },
          }}
        />
      </StyleProvider>
    </ConfigProvider>
  );
};
