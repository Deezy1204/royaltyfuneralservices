"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  CreditCard,
  FileCheck,
  Calendar,
} from "lucide-react";

const reportTypes = [
  { id: "revenue", name: "Revenue Report", icon: CreditCard, description: "Monthly revenue breakdown" },
  { id: "claims", name: "Claims Report", icon: FileCheck, description: "Claims statistics and payouts" },
  { id: "policies", name: "Policy Report", icon: FileText, description: "Active policies analysis" },
  { id: "agents", name: "Agent Performance", icon: Users, description: "Sales by agent" },
  { id: "arrears", name: "Arrears Report", icon: TrendingDown, description: "Outstanding payments" },
  { id: "renewals", name: "Renewals Report", icon: Calendar, description: "Upcoming renewals" },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    totalRevenue: 0, revenueGrowth: 0,
    claimsPaid: 0, claimsGrowth: 0,
    newPolicies: 0, policyGrowth: 0,
    netPosition: 0
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);
  const [topAgents, setTopAgents] = useState<any[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch("/api/reports");
        if (res.ok) {
          const data = await res.json();
          setMetrics(data.keyMetrics);
          setMonthlyData(data.monthlyData || []);
          setPlanDistribution(data.planDistribution || []);
          setTopAgents(data.topAgents || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading reports...</div>;
  }

  const exportCSV = (data: any[], filename: string) => {
    if (!data || !data.length) {
      alert("No data available to export");
      return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = (type: string) => {
    switch (type) {
      case 'revenue': exportCSV(monthlyData, 'revenue_report.csv'); break;
      case 'policies': exportCSV(planDistribution, 'policies_report.csv'); break;
      case 'agents': exportCSV(topAgents, 'agents_report.csv'); break;
      default: exportCSV(monthlyData, 'report.csv');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500">Business insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026-03">March 2026</SelectItem>
              <SelectItem value="2026-02">February 2026</SelectItem>
              <SelectItem value="2026-01">January 2026</SelectItem>
              <SelectItem value="2025-12">December 2025</SelectItem>
              <SelectItem value="2025-11">November 2025</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport('revenue')}>
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalRevenue)}</p>
                <div className={`flex items-center mt-1 text-sm ${metrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.revenueGrowth >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {metrics.revenueGrowth > 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(1)}% vs last month
                </div>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Claims Paid</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.claimsPaid)}</p>
                <div className={`flex items-center mt-1 text-sm ${metrics.claimsGrowth >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {metrics.claimsGrowth >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {metrics.claimsGrowth > 0 ? '+' : ''}{metrics.claimsGrowth.toFixed(1)}% vs last month
                </div>
              </div>
              <div className="rounded-full bg-orange-100 p-3">
                <FileCheck className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">New Policies</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.newPolicies}</p>
                <div className={`flex items-center mt-1 text-sm ${metrics.policyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.policyGrowth >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {metrics.policyGrowth > 0 ? '+' : ''}{metrics.policyGrowth.toFixed(1)}% vs last month
                </div>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Net Position</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.netPosition)}</p>
                <p className="text-xs text-gray-500 mt-1">Revenue - Claims</p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
                <CardDescription>Revenue vs Claims trend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyData.map((data) => (
                    <div key={data.month} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{data.month} 2026</span>
                        <span className="text-gray-500">
                          {formatCurrency(data.revenue - data.claims)} net
                        </span>
                      </div>
                      <div className="flex gap-2 h-4">
                        <div
                          className="bg-green-500 rounded"
                          style={{ width: `${Math.min(100, Math.max(5, (data.revenue / 500000) * 100))}%` }}
                          title={`Revenue: ${formatCurrency(data.revenue)}`}
                        />
                        <div
                          className="bg-red-400 rounded"
                          style={{ width: `${Math.min(100, Math.max(5, (data.claims / 500000) * 100))}%` }}
                          title={`Claims: ${formatCurrency(data.claims)}`}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Revenue: {formatCurrency(data.revenue)}</span>
                        <span>Claims: {formatCurrency(data.claims)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-4 pt-4 border-t text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span>Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded" />
                    <span>Claims</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plan Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Policy Distribution by Plan</CardTitle>
                <CardDescription>Active policies breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {planDistribution.map((plan) => (
                    <div key={plan.plan} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              plan.plan === "WHITE"
                                ? "white"
                                : plan.plan === "GOLD"
                                  ? "gold"
                                  : plan.plan === "BLUE"
                                    ? "blue"
                                    : "purple"
                            }
                          >
                            {plan.plan}
                          </Badge>
                          <span className="text-sm text-gray-600">{plan.count} policies</span>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(plan.revenue)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${plan.plan === "WHITE"
                            ? "bg-gray-400"
                            : plan.plan === "GOLD"
                              ? "bg-yellow-400"
                              : plan.plan === "BLUE"
                                ? "bg-blue-400"
                                : "bg-purple-400"
                            }`}
                          style={{ width: `${plan.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Downloads */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Reports</CardTitle>
              <CardDescription>Download detailed reports in PDF or Excel format</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {reportTypes.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-purple-100 p-2">
                        <report.icon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{report.name}</p>
                        <p className="text-xs text-gray-500">{report.description}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleExport(report.id)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Agents</CardTitle>
              <CardDescription>Sales performance this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topAgents.length === 0 ? <p className="text-gray-500 text-sm">No agent data available.</p> : null}
                {topAgents.map((agent, index) => (
                  <div
                    key={agent.name}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${index === 0
                          ? "bg-yellow-500"
                          : index === 1
                            ? "bg-gray-400"
                            : index === 2
                              ? "bg-orange-400"
                              : "bg-gray-300"
                          }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{agent.name}</p>
                        <p className="text-sm text-gray-500">{agent.policies} policies sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(agent.revenue)}</p>
                      <p className="text-xs text-gray-500">Total premium</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analysis</CardTitle>
              <CardDescription>Detailed monthly revenue vs claims</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-3xl">
                {monthlyData.map((data) => (
                  <div key={data.month} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{data.month} 2026</span>
                      <span className="text-gray-500">
                        {formatCurrency(data.revenue - data.claims)} net
                      </span>
                    </div>
                    <div className="flex gap-2 h-4">
                      <div
                        className="bg-green-500 rounded"
                        style={{ width: `${Math.min(100, Math.max(5, (data.revenue / 500000) * 100))}%` }}
                        title={`Revenue: ${formatCurrency(data.revenue)}`}
                      />
                      <div
                        className="bg-red-400 rounded"
                        style={{ width: `${Math.min(100, Math.max(5, (data.claims / 500000) * 100))}%` }}
                        title={`Claims: ${formatCurrency(data.claims)}`}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Revenue: {formatCurrency(data.revenue)}</span>
                      <span>Claims: {formatCurrency(data.claims)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle>Policy Analytics</CardTitle>
              <CardDescription>Active policies breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-3xl">
                {planDistribution.map((plan) => (
                  <div key={plan.plan} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            plan.plan === "WHITE"
                              ? "white"
                              : plan.plan === "GOLD"
                                ? "gold"
                                : plan.plan === "BLUE"
                                  ? "blue"
                                  : "purple"
                          }
                        >
                          {plan.plan}
                        </Badge>
                        <span className="text-sm text-gray-600">{plan.count} policies</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(plan.revenue)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${plan.plan === "WHITE"
                          ? "bg-gray-400"
                          : plan.plan === "GOLD"
                            ? "bg-yellow-400"
                            : plan.plan === "BLUE"
                              ? "bg-blue-400"
                              : "bg-purple-400"
                          }`}
                        style={{ width: `${plan.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
