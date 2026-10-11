import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GST Reminder",
  description: "Simple GST filing deadline reminders for small Indian businesses.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
