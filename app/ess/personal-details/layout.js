"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function PersonalDetailsLayout({ children }) {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Personal Info",
      href: "/ess/personal-details",
      value: "personal",
    },
    {
      name: "Education",
      href: "/ess/personal-details/education",
      value: "education",
    },
    {
      name: "Employment History",
      href: "/ess/personal-details/employment",
      value: "employment",
    },
    {
      name: "Family",
      href: "/ess/personal-details/family",
      value: "family",
    },
  ];

  const isActive = (href) => {
    if (href === "/ess/personal-details") {
      return pathname === "/personal-details";
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Personal Details</h1>
        <p className="text-gray-600">View and manage your personal details</p>
      </div>

      {/* Tab Navigation */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mb-6">
        <div className="inline-flex w-auto min-w-max sm:w-fit md:w-full md:max-w-4xl border-b">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={tab.href}
              className={cn(
                "text-xs sm:text-sm px-2 sm:px-3 py-3 whitespace-nowrap flex-shrink-0 border-b-2 transition-colors",
                isActive(tab.href)
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              )}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Page Content */}
      <div className="w-full">{children}</div>
    </div>
  );
}
