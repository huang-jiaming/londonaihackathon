import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Repo Surgeon",
  description: "Legacy code triage with Gemini, Dust, and CodeWords"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
