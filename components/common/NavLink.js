"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ href, children }) {
  const pathname = usePathname();

  // Simple exact match: active if pathname equals href
  const isActive = pathname === href;

  // Alternatively, use startsWith to mark parent routes active
  // const isActive = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        isActive
          ? "bg-blue-600 text-white shadow-lg" // Active style: prominent bg and text
          : "text-gray-600 hover:text-blue-600" // Inactive style: muted text, hover highlight
      }`}
    >
      {children}
    </Link>
  );
}
