"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeft, BarChart2 } from "lucide-react";
import Link from "next/link";

type TimeRange = "byDay" | "byWeek" | "byMonth" | "byYear";

export default function ClaimsAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("byMonth");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/claims/analytics");
        if (res.ok) {
          const d = await res.json();
          setData(d);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const currentData = data ? data[timeRange] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/claims">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Claims Analytics</h1>
          </div>
          <p className="text-gray-500 ml-11">Visual reporting of claims and burials</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(val: TimeRange) => setTimeRange(val)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="byDay">By Day</SelectItem>
              <SelectItem value="byWeek">By Week</SelectItem>
              <SelectItem value="byMonth">By Month</SelectItem>
              <SelectItem value="byYear">By Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-purple-600" />
                Claims Volume (Submitted vs Paid)
              </CardTitle>
              <CardDescription>Number of claims processed over time</CardDescription>
            </CardHeader>
            <CardContent>
              {currentData.length > 0 ? (
                <div className="h-[400px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey={timeRange === "byDay" ? "date" : timeRange === "byWeek" ? "week" : timeRange === "byMonth" ? "month" : "year"} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="submitted" name="Submitted Claims" fill="#9333ea" radius={[4, 4, 0, 0]} barSize={40} />
                      <Bar dataKey="paid" name="Paid Claims" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-500 italic">No data available</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-green-600" />
                Total Payout Amounts
              </CardTitle>
              <CardDescription>Financial volume of paid claims</CardDescription>
            </CardHeader>
            <CardContent>
              {currentData.length > 0 ? (
                <div className="h-[400px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={currentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey={timeRange === "byDay" ? "date" : timeRange === "byWeek" ? "week" : timeRange === "byMonth" ? "month" : "year"} />
                      <YAxis tickFormatter={(val: number) => "$" + val} />
                      <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                      <Legend />
                      <Line type="monotone" dataKey="amount" name="Paid Amount" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-500 italic">No data available</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
