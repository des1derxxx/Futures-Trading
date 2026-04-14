import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./store";

export type NotificationColor = "red" | "orange" | "teal" | "blue" | "gray";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  color: NotificationColor;
  read: boolean;
  createdAt: number;
}

interface NotificationsState {
  items: AppNotification[];
}

const initialState: NotificationsState = { items: [] };

export const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<Omit<AppNotification, "id" | "read" | "createdAt">>) {
      state.items.unshift({
        ...action.payload,
        id: crypto.randomUUID(),
        read: false,
        createdAt: Date.now(),
      });
      // Keep at most 50 notifications
      if (state.items.length > 50) state.items.length = 50;
    },
    markAllRead(state) {
      for (const item of state.items) item.read = true;
    },
    clearAll(state) {
      state.items = [];
    },
  },
});

export const { addNotification, markAllRead, clearAll } = notificationsSlice.actions;

export const selectNotifications = (state: RootState) => state.notifications.items;
export const selectUnreadCount = (state: RootState) =>
  state.notifications.items.filter((n) => !n.read).length;
