"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Users,
  FileText,
  CreditCard,
  FileCheck,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalPolicies: number;
  activePolicies: number;
  pendingProposals: number;
  pendingClaims: number;
  pendingAlterations: number;
  monthlyRevenue: number;
  totalArrears: number;
  claimsPaid: number;
  policiesByPlan: { plan: string; count: number }[];
}


const emptyStats: DashboardStats = {
  totalClients: 0,
  activeClients: 0,
  totalPolicies: 0,
  activePolicies: 0,
  pendingProposals: 0,
  pendingClaims: 0,
  pendingAlterations: 0,
  monthlyRevenue: 0,
  totalArrears: 0,
  claimsPaid: 0,
  policiesByPlan: [],
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
    title: "Claims Paid",
    key: "claimsPaid" as const,
    icon: FileCheck,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    href: "/claims",
    isCurrency: true,
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
    title: "Total Arrears",
    key: "totalArrears" as const,
    icon: TrendingUp,
    color: "text-red-600",
    href: "/payments?filter=arrears",
    isCurrency: true,
  },
];

const planColors: Record<string, string> = {
  WHITE: "bg-gray-100 text-gray-800",
  GOLD: "bg-yellow-100 text-yellow-800",
  BLUE: "bg-blue-100 text-blue-800",
  PURPLE: "bg-purple-100 text-purple-800",
};

const activityIcons: Record<string, typeof FileText> = {
  proposal: FileText,
  payment: CreditCard,
  claim: FileCheck,
  alteration: TrendingUp,
  client: Users,
};

export default function DashboardPage() {
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

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 text-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome to Royalty Funeral Services</h1>
            <p className="mt-1 text-gray-500">
              Admin Dashboard - {formatDate(new Date())}
            </p>
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
        {statCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{card.title}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {card.isCurrency
                        ? formatCurrency(stats[card.key] as number)
                        : stats[card.key].toLocaleString()}
                    </p>
                    {card.subKey && (
                      <p className="mt-1 text-xs text-gray-400">
                        of {stats[card.subKey].toLocaleString()} total
                      </p>
                    )}
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
              {pendingCards.map((card) => (
                <Link key={card.title} href={card.href}>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{card.title}</p>
                        <p className="text-lg font-bold text-gray-900">
                          {card.isCurrency
                            ? formatCurrency(stats[card.key] as number)
                            : stats[card.key]}
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
                    <Badge className={planColors[item.plan]}>{item.plan}</Badge>
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

      {/* Quick Actions & Summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items Requiring Attention</CardTitle>
            <CardDescription>Real-time pending counts from the database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {pendingCards.map((card) => (
                <Link key={card.title} href={card.href}>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{card.title}</p>
                        <p className="text-lg font-bold text-gray-900">
                          {card.isCurrency
                            ? formatCurrency(stats[card.key] as number)
                            : (stats[card.key] as number)}
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { href: "/clients/new", label: "Register New Client", icon: Users, bg: "bg-blue-50 hover:bg-blue-100", color: "text-blue-700", border: "border-blue-200" },
              { href: "/proposals/new", label: "Create Proposal", icon: FileText, bg: "bg-purple-50 hover:bg-purple-100", color: "text-purple-700", border: "border-purple-200" },
              { href: "/payments/new", label: "Record Payment", icon: CreditCard, bg: "bg-green-50 hover:bg-green-100", color: "text-green-700", border: "border-green-200" },
              { href: "/claims/new", label: "Submit Claim", icon: FileCheck, bg: "bg-orange-50 hover:bg-orange-100", color: "text-orange-700", border: "border-orange-200" },
              { href: "/alterations/new", label: "Policy Alteration", icon: TrendingUp, bg: "bg-indigo-50 hover:bg-indigo-100", color: "text-indigo-700", border: "border-indigo-200" },
            ].map(({ href, label, icon: Icon, bg, color, border }) => (
              <Link key={href} href={href}>
                <div className={`flex items-center gap-3 rounded-lg border ${border} ${bg} px-4 py-3 transition-all duration-150 hover:shadow-sm cursor-pointer`}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${bg} ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-sm font-semibold ${color}`}>{label}</span>
                  <ArrowRight className="ml-auto h-4 w-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
