import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import AppShell from "@/components/common/AppShell";
import { AuthProvider } from "@/components/common/AuthContext";
export const metadata = {
  title: {
    default: "HRMS - Human Resource Management System",
    template: "%s | HRMS",
  },
  description:
    "Human Resource Management System (HRMS) for managing employees, attendance, leave, payroll, and comprehensive HR operations",
  keywords: [
    "HRMS",
    "human resource management",
    "employee management",
    "HR",
    "attendance",
    "payroll",
    "leave management",
    "workforce management",
  ],
  authors: [{ name: "HRMS Team" }],
  creator: "HRMS Team",
  openGraph: {
    title: "HRMS - Human Resource Management System",
    description:
      "Comprehensive Human Resource Management System for managing employees, attendance, leave, payroll, and HR operations",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HRMS - Human Resource Management System",
    description:
      "Comprehensive Human Resource Management System for managing employees, attendance, leave, payroll, and HR operations",
  },
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
          <AppShell>{children}</AppShell>
        </AuthProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
