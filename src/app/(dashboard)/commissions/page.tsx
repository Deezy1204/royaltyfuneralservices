"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Calculator, Users, DollarSign, Download, ChevronRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface CommissionSummary {
  totalAgents: number;
  totalPremiumsCollected: number;
  totalCommissionsOwed: number;
}

interface ClientCommission {
  id: string;
  name: string;
  premiumPaid: number;
  commission: number;
  paymentsCount: number;
}

interface AgentCommission {
  id: string;
  name: string;
  email: string;
  commissionRate: number;
  clientsCount: number;
  activePayingClients: number;
  totalPremiums: number;
  totalCommission: number;
  clientDetails: ClientCommission[];
  years: number;
  status: "OWED" | "PAID";
}

export default function CommissionsPage() {
  const [agents, setAgents] = useState<AgentCommission[]>([]);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<number>(new Date().getMonth());
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/commissions?month=${month}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setAgents(data.commissions || []);
        setSummary(data.summary || null);
      } else {
        toast.error("Failed to load commissions");
      }
    } catch (error) {
      console.error("Error fetching commissions:", error);
      toast.error("Error loading commissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const toggleRow = (id: string) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
  };

  const handleMarkAsPaid = async (agentId: string, amount: number) => {
    try {
      const res = await fetch("/api/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, month, year, amount }),
      });
      if (res.ok) {
        toast.success("Commission marked as paid");
        fetchCommissions();
      } else {
        toast.error("Failed to mark as paid");
      }
    } catch (error) {
      console.error("Error marking as paid:", error);
      toast.error("Error updating commission status");
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
          <h1 className="text-2xl font-bold text-gray-900">Smart Commissions</h1>
          <p className="text-gray-500">Calculate and track agent commissions (20% Year 1, 10% Year +2)</p>
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

          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {summary && (
         <div className="grid gap-4 md:grid-cols-3">
           <Card>
             <CardContent className="pt-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-gray-500">Active Agents</p>
                   <p className="text-2xl font-bold text-gray-900">{summary.totalAgents}</p>
                 </div>
                 <div className="rounded-full bg-blue-100 p-3">
                   <Users className="h-5 w-5 text-blue-600" />
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="pt-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-gray-500">Premiums Collected</p>
                   <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPremiumsCollected)}</p>
                 </div>
                 <div className="rounded-full bg-green-100 p-3">
                   <DollarSign className="h-5 w-5 text-green-600" />
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="pt-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-gray-500">Commissions Owed</p>
                   <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.totalCommissionsOwed)}</p>
                 </div>
                 <div className="rounded-full bg-purple-100 p-3">
                   <Calculator className="h-5 w-5 text-purple-600" />
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Agent Commission Breakdown</CardTitle>
          <CardDescription>
            Showing commissions for {months[month]} {year} based on confirmed payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center items-center py-12">
               <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
             </div>
          ) : agents.length === 0 ? (
             <div className="text-center py-12 text-gray-500">
               No agent activity found for this period.
             </div>
          ) : (
             <div className="border rounded-md">
               <Table>
                 <TableHeader className="bg-gray-50">
                   <TableRow>
                     <TableHead className="w-10"></TableHead>
                     <TableHead>Agent Name</TableHead>
                     <TableHead>Total Clients</TableHead>
                     <TableHead>Paying Clients</TableHead>
                     <TableHead>Commission Rate</TableHead>
                      <TableHead className="text-right">Total Premiums</TableHead>
                      <TableHead className="text-right">Comm. Owed</TableHead>
                      <TableHead className="text-center w-24">Years</TableHead>
                      <TableHead className="w-24 text-right">Action</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                   {agents.map((agent) => {
                     const isExpanded = expandedRow === agent.id;
                     return (
                       <React.Fragment key={agent.id}>
                         <TableRow 
                           className="cursor-pointer hover:bg-gray-50"
                           onClick={() => toggleRow(agent.id)}
                         >
                           <TableCell>
                             {isExpanded ? (
                               <ChevronDown className="h-4 w-4 text-gray-500" />
                             ) : (
                               <ChevronRight className="h-4 w-4 text-gray-500" />
                             )}
                           </TableCell>
                           <TableCell className="font-medium text-purple-700">{agent.name}</TableCell>
                           <TableCell>{agent.clientsCount}</TableCell>
                           <TableCell>{agent.activePayingClients}</TableCell>
                           <TableCell>
                             <Badge variant={agent.commissionRate === 20 ? "default" : "secondary"}>
                               {agent.commissionRate}%
                             </Badge>
                           </TableCell>
                           <TableCell className="text-right font-medium">
                             {formatCurrency(agent.totalPremiums)}
                           </TableCell>
                            <TableCell className="text-right font-bold text-green-600">
                              {formatCurrency(agent.totalCommission)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="font-mono">{agent.years}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {agent.status === "PAID" ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase text-[10px] font-bold">Paid</Badge>
                              ) : agent.totalCommission > 0 ? (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 border-purple-200 text-purple-700 hover:bg-purple-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsPaid(agent.id, agent.totalCommission);
                                  }}
                                >
                                  Mark Paid
                                </Button>
                              ) : (
                                <span className="text-xs text-gray-400 italic">No Activity</span>
                              )}
                            </TableCell>
                          </TableRow>
                                                  {isExpanded && (
                            <TableRow className="bg-gray-50/50">
                              <TableCell colSpan={9} className="p-0 border-b">
                                <div className="px-10 py-4">
                                 <h4 className="text-sm font-semibold mb-3 text-gray-900 flex items-center gap-2">
                                   <Users className="h-4 w-4" /> Client Payment Details ({months[month]} {year})
                                 </h4>
                                 {agent.clientDetails.length > 0 ? (
                                   <Table className="bg-white border rounded-lg overflow-hidden">
                                     <TableHeader>
                                       <TableRow>
                                         <TableHead className="text-xs">Client Name</TableHead>
                                         <TableHead className="text-xs text-center">Payments Found</TableHead>
                                         <TableHead className="text-xs text-right">Premium Paid</TableHead>
                                         <TableHead className="text-xs text-right text-purple-700">Earnings</TableHead>
                                       </TableRow>
                                     </TableHeader>
                                     <TableBody>
                                       {agent.clientDetails.map(client => (
                                         <TableRow key={client.id}>
                                           <TableCell className="text-sm">{client.name}</TableCell>
                                           <TableCell className="text-sm text-center">{client.paymentsCount}</TableCell>
                                           <TableCell className="text-sm text-right">{formatCurrency(client.premiumPaid)}</TableCell>
                                           <TableCell className="text-sm text-right font-semibold text-purple-700">
                                             {formatCurrency(client.commission)}
                                           </TableCell>
                                         </TableRow>
                                       ))}
                                     </TableBody>
                                   </Table>
                                 ) : (
                                   <p className="text-sm text-gray-500 italic">No payments recorded for this agent's clients in this period.</p>
                                 )}
                               </div>
                             </TableCell>
                           </TableRow>
                         )}
                       </React.Fragment>
                     );
                   })}
                 </TableBody>
               </Table>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
