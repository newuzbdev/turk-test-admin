import { notification } from "antd";
import type { NotificationPlacement } from "antd/es/notification/interface";

interface NotificationConfig {
  message: string;
  description?: string;
  placement?: NotificationPlacement;
  duration?: number;
}

export const showNotification = {
  success: ({ message, description, placement = "topRight", duration = 4.5 }: NotificationConfig) => {
    notification.success({
      message,
      description,
      placement,
      duration,
      style: {
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      },
    });
  },

  error: ({ message, description, placement = "topRight", duration = 4.5 }: NotificationConfig) => {
    notification.error({
      message,
      description,
      placement,
      duration,
      style: {
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      },
    });
  },

  warning: ({ message, description, placement = "topRight", duration = 4.5 }: NotificationConfig) => {
    notification.warning({
      message,
      description,
      placement,
      duration,
      style: {
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      },
    });
  },

  info: ({ message, description, placement = "topRight", duration = 4.5 }: NotificationConfig) => {
    notification.info({
      message,
      description,
      placement,
      duration,
      style: {
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      },
    });
  },
};
