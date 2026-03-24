"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";
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
  Shield,
  LogOut,
  User,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigationItems = [
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

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const filteredNavigation = navigationItems.filter((item) => {
    if ((item.name === "Settings" || item.name === "Users" || item.name === "Audit Logs") && user?.role !== "ADMIN" && user?.role !== "DIRECTOR") {
      return false;
    }
    return true;
  });

  const mainNavItems = filteredNavigation.slice(0, 7);
  const moreNavItems = filteredNavigation.slice(7);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm print:hidden">
      <div className="flex h-16 items-center px-4 lg:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 mr-8 hidden lg:flex">
          <Image
            src="/images/logo.png"
            alt="Royalty Funeral Services"
            width={40}
            height={40}
            className="object-contain"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900 leading-tight">Royalty</span>
            <span className="text-xs text-gray-500 leading-tight">Funeral Services</span>
          </div>
        </Link>
        
        {/* Mobile Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
          <Image
            src="/images/logo.png"
            alt="Royalty Funeral Services"
            width={32}
            height={32}
            className="object-contain"
          />
          <span className="text-sm font-bold text-gray-900">Royalty</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex flex-1 items-center space-x-1 overflow-x-auto pb-1 mt-1">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "text-purple-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon
                  className={cn(
                    "h-4 w-4 relative z-10",
                    isActive ? "text-purple-600" : "text-gray-400"
                  )}
                />
                <span className="relative z-10">{item.name}</span>
              </Link>
            );
          })}
          
          {moreNavItems.length > 0 && (
            <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-gray-600 hover:bg-gray-100 font-medium px-3 py-2 ml-1 flex items-center gap-1"
                  onMouseEnter={() => setMoreOpen(true)}
                  onMouseLeave={() => setMoreOpen(false)}
                >
                  More
                  <ChevronDown className="h-3.5 w-3.5 mt-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-48"
                onMouseEnter={() => setMoreOpen(true)}
                onMouseLeave={() => setMoreOpen(false)}
              >
                {moreNavItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <DropdownMenuItem key={item.name} onClick={() => router.push(item.href)}>
                      <item.icon className={cn("mr-2 h-4 w-4", isActive ? "text-purple-600" : "text-gray-500")} />
                      <span className={isActive ? "text-purple-700 font-medium" : ""}>{item.name}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        <div className="flex flex-1 lg:flex-none justify-end gap-2 ml-auto">
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 ml-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                    {user ? getInitials(user.firstName, user.lastName) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 leading-tight">
                    {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
                  </p>
                  <p className="text-xs text-gray-500 capitalize leading-tight">{user?.role?.toLowerCase() || ""}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              {user?.role === "ADMIN" && (
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-50 focus:text-red-700">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-col overflow-y-auto bg-white pb-12 shadow-xl">
            <div className="flex px-4 pb-2 pt-5 items-center justify-between border-b border-gray-100">
              <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <Image
                  src="/images/logo.png"
                  alt="Royalty Funeral Services"
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">Royalty</span>
                  <span className="text-xs text-gray-500">Funeral Services</span>
                </div>
              </Link>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <nav className="mt-4 px-2 space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium transition-colors",
                      isActive
                        ? "bg-purple-50 text-purple-700"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
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
                );
              })}
            </nav>
            <div className="mt-auto pt-6 px-4">
              <div className="border-t border-gray-200 py-4">
                <Button variant="outline" className="w-full text-red-600 justify-start" onClick={handleLogout}>
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
