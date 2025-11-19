import { AuthProvider } from "@/components/auth/AuthContext";
import "./globals.css";
import MainLayout from "@/components/common/MainLayout";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: {
    default: "EMS - Employee Management System",
    template: "%s | EMS",
  },
  description: "Employee Management System for managing employees, attendance, and HR operations",
  keywords: ["employee management", "HR", "attendance", "EMS"],
  authors: [{ name: "EMS Team" }],
  creator: "EMS Team",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased flex">
        <AuthProvider>
          <MainLayout>{children}</MainLayout>
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
