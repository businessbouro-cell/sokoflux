"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useNotificationStore } from "@/stores/useNotificationStore";

export function NotificationPoller() {
  const { status } = useSession();
  const setNotifications = useNotificationStore((s) => s.setNotifications);

  useEffect(() => {
    if (status !== "authenticated") return;

    function fetchNotifs() {
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setNotifications(data);
        })
        .catch(() => {});
    }

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(interval);
  }, [status, setNotifications]);

  return null;
}
