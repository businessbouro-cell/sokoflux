"use client";

import { SessionProvider } from "next-auth/react";
import { NotificationPoller } from "@/components/common/NotificationPoller";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <NotificationPoller />
      {children}
    </SessionProvider>
  );
}
