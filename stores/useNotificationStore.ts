"use client";

import { create } from "zustand";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  setNotifications: (notifs: AppNotification[]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (notif: AppNotification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    set({ notifications, unreadCount });
  },
  addNotification: (notif) => {
    const notifications = [notif, ...get().notifications];
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    set({ notifications, unreadCount });
  },
  markRead: (id) => {
    const notifications = get().notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    set({ notifications, unreadCount: notifications.filter((n) => !n.isRead).length });
  },
  markAllRead: () =>
    set({
      notifications: get().notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }),
}));
