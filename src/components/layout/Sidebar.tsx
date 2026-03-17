"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  RefreshCw,
  CreditCard,
  FileCheck,
  BarChart3,
  UserCog,
  Settings,
  X,
  Shield,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Proposals", href: "/proposals", icon: FileText },
  { name: "Alterations", href: "/alterations", icon: RefreshCw },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Declarations", href: "/declarations", icon: FileText },
  { name: "Claims", href: "/claims", icon: FileCheck },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Users", href: "/users", icon: UserCog },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Audit Logs", href: "/audit-logs", icon: Shield },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-full lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-between px-4 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt="Royalty Funeral Services"
                width={48}
                height={48}
                className="object-contain"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900">Royalty</span>
                <span className="text-xs text-gray-500">Funeral Services</span>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navigation.map((item) => {
                // Conditional rendering for admin-only items
                if ((item.name === "Settings" || item.name === "Users" || item.name === "Audit Logs") && user?.role !== "ADMIN") {
                  return null;
                }
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-purple-50 text-purple-700"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5",
                          isActive ? "text-purple-600" : "text-gray-400"
                        )}
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <p className="text-xs text-gray-500 text-left">
              Royalty Funeral Services
              <br />
              Admin Dashboard v1.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
