import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Life RPG — Your Real Life Is the Game",
  description: "Turn real-life actions into verifiable RPG progression.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
