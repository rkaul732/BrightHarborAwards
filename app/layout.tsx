import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bright Harbor | Recognition",
  description: "A place to celebrate the people who make Bright Harbor shine.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
