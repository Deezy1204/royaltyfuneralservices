"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, PLAN_COLORS } from "@/lib/utils";
import {
  Users,
  FileText,
  CreditCard,
  FileCheck,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useAuth } from "@/hooks/useAuth";

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalPolicies: number;
  activePolicies: number;
  pendingProposals: number;
  totalClaims: number;
  pendingClaims: number;
  pendingAlterations: number;
  pendingPayments: number;
  monthlyRevenue: number;
  claimsPaid: number;
  policiesByPlan: { plan: string; count: number }[];
  paymentsByMethod: { method: string; count: number }[];
}


const emptyStats: DashboardStats = {
  totalClients: 0,
  activeClients: 0,
  totalPolicies: 0,
  activePolicies: 0,
  pendingProposals: 0,
  totalClaims: 0,
  pendingClaims: 0,
  pendingAlterations: 0,
  pendingPayments: 0,
  monthlyRevenue: 0,
  claimsPaid: 0,
  policiesByPlan: [],
  paymentsByMethod: [],
};

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  CASH: "#10b981", // Emerald
  EFT: "#3b82f6", // Blue
  DEBIT_ORDER: "#8b5cf6", // Violet
  CARD: "#f59e0b", // Amber
};


const statCards = [
  {
    title: "Total Clients",
    key: "activeClients" as const,
    subKey: "totalClients" as const,
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    href: "/clients",
  },
  {
    title: "Active Policies",
    key: "activePolicies" as const,
    subKey: "totalPolicies" as const,
    icon: FileText,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    href: "/clients",
  },
  {
    title: "Monthly Revenue",
    key: "monthlyRevenue" as const,
    icon: CreditCard,
    color: "text-green-600",
    bgColor: "bg-green-100",
    href: "/payments",
    isCurrency: true,
  },
  {
    title: "Total Claims",
    key: "totalClaims" as const,
    icon: FileCheck,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    href: "/claims",
  },
];

const pendingCards = [
  {
    title: "Pending Proposals",
    key: "pendingProposals" as const,
    icon: Clock,
    color: "text-yellow-600",
    href: "/proposals?status=pending",
  },
  {
    title: "Pending Claims",
    key: "pendingClaims" as const,
    icon: AlertCircle,
    color: "text-red-600",
    href: "/claims?status=pending",
  },
  {
    title: "Pending Alterations",
    key: "pendingAlterations" as const,
    icon: Clock,
    color: "text-blue-600",
    href: "/alterations?status=pending",
  },
  {
    title: "Pending Payments",
    key: "pendingPayments" as const,
    icon: CreditCard,
    color: "text-purple-600",
    href: "/payments?status=pending",
    hideForAgents: true,
  },
];



const activityIcons: Record<string, typeof FileText> = {
  proposal: FileText,
  payment: CreditCard,
  claim: FileCheck,
  alteration: TrendingUp,
  client: Users,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const isAgent = user?.role === "AGENT";
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getDashboardTitle = () => {
    if (!user) return "Admin Dashboard";
    switch (user.role) {
      case "AGENT": return "Agent Dashboard";
      case "DIRECTOR": return "Director Dashboard";
      case "SUPER_ADMIN": return "Super Admin Dashboard";
      case "ADMIN": return "Admin Dashboard";
      default: return `${user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()} Dashboard`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 text-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome to Royalty Funeral Services</h1>
            <p className="mt-1 text-gray-500 font-medium">
              {getDashboardTitle()} - {formatDate(new Date())}
            </p>
            <div className="mt-2 text-xs text-gray-400 space-y-0.5">
              <p>Phones: +263 71 787 4750 / +263 71 787 4747</p>
              <p>Address: Stand 15383, Khami Road Kelvin North 11, Bulawayo</p>
            </div>
          </div>
          <Image
            src="/images/logo.png"
            alt="Royalty"
            width={80}
            height={80}
            className="object-contain opacity-90"
          />
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards
          .filter(card => {
            if (user?.role === 'AGENT') {
              return card.key !== 'monthlyRevenue' && card.key !== 'totalClaims';
            }
            return true;
          })
          .map((card) => (
            <Link key={card.title} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{card.title}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 flex items-baseline gap-2">
                      {card.isCurrency
                        ? formatCurrency(stats[card.key] as number)
                        : stats[card.key].toLocaleString()}
                      {card.subKey && (
                        <span className="text-xs font-normal text-gray-400">
                          of {stats[card.subKey].toLocaleString()} total
                        </span>
                      )}
                    </p>
                  </div>
                  <div className={`rounded-full p-3 ${card.bgColor}`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pending Items & Plans */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {pendingCards
                .filter(card => !(isAgent && (card as any).hideForAgents))
                .map((card) => (
                  <Link key={card.title} href={card.href}>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <card.icon className={`h-5 w-5 ${card.color}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{card.title}</p>
                          <p className="text-lg font-bold text-gray-900">
                            {stats[card.key].toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </Link>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Policies by Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Policies by Plan</CardTitle>
            <CardDescription>Active policy distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.policiesByPlan.map((item) => (
                <div key={item.plan} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={PLAN_COLORS[item.plan] || "bg-gray-100 text-gray-800"}>{item.plan}</Badge>
                    <span className="text-sm text-gray-600">Plan</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total Active</span>
                <span className="font-bold text-gray-900">
                  {stats.policiesByPlan.reduce((sum, p) => sum + p.count, 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Row */}
      {!isAgent && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods Popularity</CardTitle>
              <CardDescription>Distribution of confirmed payments</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.paymentsByMethod.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.paymentsByMethod}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="method"
                        label={({ name, percent }) => `${(name || "").replace("_", " ")} ${(((percent || 0) * 100).toFixed(0))}%`}
                      >
                        {stats.paymentsByMethod.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={PAYMENT_METHOD_COLORS[entry.method] || "#94a3b8"} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [value, "Payments"]}
                        labelFormatter={(label: any) => String(label || "").replace("_", " ")}
                      />
                      <Legend formatter={(value) => String(value || "").replace("_", " ")} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 italic">
                  No payment data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

        {/* Quick Actions removed */}
    </div>
  );
}
