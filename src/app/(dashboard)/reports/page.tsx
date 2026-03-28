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
import { useAuth } from "@/hooks/useAuth";

const reportTypes = [
  { id: "revenue", name: "Revenue Report", icon: CreditCard, description: "Monthly revenue breakdown" },
  { id: "claims", name: "Claims Report", icon: FileCheck, description: "Claims statistics and payouts" },
  { id: "policies", name: "Policy Report", icon: FileText, description: "Active policies analysis" },
  { id: "agents", name: "Agent Performance", icon: Users, description: "Sales by agent" },
  { id: "renewals", name: "Renewals Report", icon: Calendar, description: "Upcoming renewals" },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [month, setMonth] = useState<number>(new Date().getMonth());
  const [year, setYear] = useState<number>(new Date().getFullYear());
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

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?month=${month}&year=${year}`);
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

  useEffect(() => {
    fetchReports();
  }, [month, year]);

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
      case 'revenue': exportCSV(monthlyData, `revenue_report_${months[month]}_${year}.csv`); break;
      case 'policies': exportCSV(planDistribution, `policies_report_${months[month]}_${year}.csv`); break;
      case 'agents': exportCSV(topAgents, `agents_performance_${months[month]}_${year}.csv`); break;
      default: exportCSV(monthlyData, `report_${months[month]}_${year}.csv`);
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500">Business insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={month.toString()} onValueChange={(val) => setMonth(parseInt(val))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m, i) => (
                <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={year.toString()} onValueChange={(val) => setYear(parseInt(val))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="default" className="bg-purple-600 hover:bg-purple-700" onClick={() => exportCSV(monthlyData, `report_${months[month]}_${year}.csv`)}>
            <Download className="mr-2 h-4 w-4" />
            Generate Reports
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Key Metrics - Hidden for Agents */}
          {user?.role !== 'AGENT' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Revenue ({months[month]})</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalRevenue)}</p>
                      <div className={`flex items-center mt-1 text-sm ${metrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metrics.revenueGrowth >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                        {Math.abs(metrics.revenueGrowth).toFixed(1)}%
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
                        {Math.abs(metrics.claimsGrowth).toFixed(1)}%
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
                        {Math.abs(metrics.policyGrowth).toFixed(1)}%
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
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(metrics.netPosition)}</p>
                      <p className="text-xs text-gray-500 mt-1">Cash Flow Surplus</p>
                    </div>
                    <div className="rounded-full bg-purple-100 p-3">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Consolidated Month Summary</CardTitle>
                  <CardDescription>Key performance summary for {months[month]} {year}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                            <span className="text-sm font-medium">Total Premiums Collected</span>
                            <span className="font-bold text-green-600">{formatCurrency(metrics.totalRevenue)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                            <span className="text-sm font-medium">Total Claims Processed</span>
                            <span className="font-bold text-red-600">{formatCurrency(metrics.claimsPaid)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                            <span className="text-sm font-medium">New Business (Policies)</span>
                            <span className="font-bold text-blue-600">{metrics.newPolicies}</span>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-700">Detailed Report Packs</h4>
                        <div className="grid gap-2">
                            {reportTypes.map((report) => (
                                <Button 
                                    key={report.id} 
                                    variant="outline" 
                                    className="justify-start h-10 border-gray-200"
                                    onClick={() => handleExport(report.id)}
                                >
                                    <report.icon className="mr-2 h-4 w-4 text-purple-600" />
                                    {report.name}
                                </Button>
                            ))}
                        </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Performance Leaderboard</CardTitle>
                  <CardDescription>Ranked by policies registered in {months[month]} {year}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topAgents.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 italic">No agent performance data found for this period.</div>
                    ) : (
                        topAgents.map((agent, index) => (
                          <div
                            key={agent.name}
                            className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                                  index === 0 ? "bg-yellow-500" : 
                                  index === 1 ? "bg-gray-400" : 
                                  index === 2 ? "bg-orange-400" : "bg-purple-100 text-purple-600"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{agent.name}</p>
                                <p className="text-xs text-gray-500">Policies Registered: <span className="text-purple-600 font-bold">{agent.policies}</span></p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">{formatCurrency(agent.revenue)}</p>
                              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Premium Revenue Per Month</p>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
