import type { Metadata } from "next";
import App from "@/App";
import { defaultDatabase } from "@/data/database";

export const metadata: Metadata = { title: "Admin Studio — AXD DIGITAL LAB", robots: "noindex, nofollow" };

export default function AdminPage() {
  return <App initialDb={defaultDatabase} initialAdmin />;
}
