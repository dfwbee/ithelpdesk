import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import "./forms.css";
import "./tickets.css";
import "./auth.css";
import "./assets.css";
import "./collab.css";
import "./polish.css";
import { AuthProvider } from "../components/AuthProvider";
import { TicketsProvider } from "../components/TicketsProvider";
import { AssetsProvider } from "../components/AssetsProvider";
import { NotificationsProvider } from "../components/NotificationsProvider";
import AppShell from "../components/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Smart IT Helpdesk",
  description:
    "An IT helpdesk with proposed improvements.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AuthProvider>
          <TicketsProvider>
            <AssetsProvider>
              <NotificationsProvider>
                <Suspense fallback={null}>
                  <AppShell>{children}</AppShell>
                </Suspense>
              </NotificationsProvider>
            </AssetsProvider>
          </TicketsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}