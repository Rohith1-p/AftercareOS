"use client";

import { useEffect } from "react";

// Pings a cheap server endpoint every 20s to keep the server→Supabase HTTPS
// connection warm. Removes the "first click after idle is slow" cold start.
export function KeepAlive() {
  useEffect(() => {
    const ping = () => fetch("/api/keepalive", { cache: "no-store" }).catch(() => {});
    const id = setInterval(ping, 20_000);
    return () => clearInterval(id);
  }, []);
  return null;
}
