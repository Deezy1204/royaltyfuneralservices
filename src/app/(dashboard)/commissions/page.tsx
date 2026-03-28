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
import { Calculator, Users, DollarSign, Download, ChevronRight, ChevronDown, Calendar, Receipt } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

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
  paidAmount: number;
  owedAmount: number;
  paymentsCount: number;
  payments: Array<{
    id: string;
    date: string;
    amount: number;
    months: string;
    commission: number;
    paid: boolean;
  }>;
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
  totalPaid: number;
  totalOwed: number;
  clientDetails: ClientCommission[];
  years: number;
  status: "OWED" | "PAID" | "PARTLY_PAID";
}

export default function CommissionsPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<AgentCommission[]>([]);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<number>(new Date().getMonth());
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

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
      setExpandedClients(new Set());
    } else {
      setExpandedRow(id);
    }
  };

  const toggleClient = (clientId: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId);
    } else {
      newExpanded.add(clientId);
    }
    setExpandedClients(newExpanded);
  };

  const handleMarkAsPaid = async (paymentId: string, amount: number, agentId: string) => {
    try {
      const res = await fetch("/api/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, amount, agentId }),
      });
      if (res.ok) {
        toast.success("Payment commission marked as paid");
        fetchCommissions();
      } else {
        toast.error("Failed to mark as paid");
      }
    } catch (error) {
      console.error("Error marking as paid:", error);
      toast.error("Error updating commission status");
    }
  };

  const handleExportCSV = () => {
    if (agents.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Agent Name", "Total Clients", "Paying Clients", "Commission Rate", "Total Premiums", "Commission Owed", "Years", "Status"];
    const csvRows = [headers.join(",")];

    agents.forEach(agent => {
      const row = [
        `"${agent.name}"`,
        agent.clientsCount,
        agent.activePayingClients,
        `"${agent.commissionRate}%"`,
        agent.totalPremiums,
        agent.totalCommission,
        agent.years,
        agent.status
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `commissions_${months[month]}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Exported successfully");
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

          <Button variant="outline" onClick={handleExportCSV}>
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
                     <TableHead className="w-24 text-center">Comm. Rate</TableHead>
                     <TableHead className="text-right w-24">Premiums</TableHead>
                     <TableHead className="text-right">Comm. Paid</TableHead>
                     <TableHead className="text-right">Comm. Owed</TableHead>
                     <TableHead className="text-center w-16">Years</TableHead>
                     <TableHead className="w-32 text-right">Status</TableHead>
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
                           <TableCell className="text-center">
                             <Badge variant={agent.commissionRate === 20 ? "default" : "secondary"} className="text-[10px]">
                               {agent.commissionRate}%
                             </Badge>
                           </TableCell>
                           <TableCell className="text-right font-medium">
                             {formatCurrency(agent.totalPremiums)}
                           </TableCell>
                           <TableCell className="text-right font-medium text-blue-600">
                             {formatCurrency(agent.totalPaid)}
                           </TableCell>
                           <TableCell className="text-right font-bold text-green-600">
                             {formatCurrency(agent.totalOwed)}
                           </TableCell>
                           <TableCell className="text-center">
                             <Badge variant="outline" className="font-mono text-[10px] h-5">{agent.years}</Badge>
                           </TableCell>
                           <TableCell className="text-right whitespace-nowrap">
                             {agent.status === "PAID" ? (
                               <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase text-[9px] font-bold px-2 py-0.5">Paid</Badge>
                             ) : agent.status === "PARTLY_PAID" ? (
                               <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 uppercase text-[9px] font-bold px-2 py-0.5">Partly Paid</Badge>
                             ) : agent.totalCommission > 0 ? (
                               <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase text-[9px] font-bold px-2 py-0.5">Owed</Badge>
                             ) : (
                               <span className="text-xs text-gray-400 italic">No Activity</span>
                             )}
                           </TableCell>
                         </TableRow>
                         {isExpanded && (
                           <TableRow className="bg-gray-50/50">
                             <TableCell colSpan={10} className="p-0 border-b">
                               <div className="px-10 py-4">
                                <h4 className="text-sm font-semibold mb-3 text-gray-900 flex items-center gap-2">
                                  <Users className="h-4 w-4" /> Client Payment Details ({months[month]} {year})
                                </h4>
                                {agent.clientDetails.length > 0 ? (
                                  <Table className="bg-white border rounded-lg overflow-hidden">
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-8"></TableHead>
                                        <TableHead className="text-xs">Client Name</TableHead>
                                        <TableHead className="text-xs text-center">Payments</TableHead>
                                        <TableHead className="text-xs text-right">Premiums</TableHead>
                                        <TableHead className="text-xs text-right text-purple-700">Earnings</TableHead>
                                        <TableHead className="text-xs text-right">Owed</TableHead>
                                        <TableHead className="text-xs text-right">Status</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {agent.clientDetails.map(client => {
                                        const isClientExpanded = expandedClients.has(client.id);
                                        return (
                                          <React.Fragment key={client.id}>
                                            <TableRow 
                                              className="bg-gray-50/30 cursor-pointer hover:bg-gray-100"
                                              onClick={() => toggleClient(client.id)}
                                            >
                                              <TableCell>
                                                {isClientExpanded ? (
                                                  <ChevronDown className="h-3 w-3 text-gray-400" />
                                                ) : (
                                                  <ChevronRight className="h-3 w-3 text-gray-400" />
                                                )}
                                              </TableCell>
                                              <TableCell className="text-sm font-medium">{client.name}</TableCell>
                                              <TableCell className="text-sm text-center">{client.paymentsCount}</TableCell>
                                              <TableCell className="text-sm text-right">{formatCurrency(client.premiumPaid)}</TableCell>
                                              <TableCell className="text-sm text-right font-semibold text-purple-700">
                                                {formatCurrency(client.commission)}
                                              </TableCell>
                                              <TableCell className="text-sm text-right text-amber-600 font-medium">
                                                {formatCurrency(client.owedAmount)}
                                              </TableCell>
                                              <TableCell className="text-right">
                                                {client.owedAmount === 0 ? (
                                                  <Badge className="bg-green-500 hover:bg-green-600 text-[10px] h-5">Paid</Badge>
                                                ) : client.paidAmount > 0 ? (
                                                  <Badge variant="secondary" className="text-[10px] h-5">Partly</Badge>
                                                ) : (
                                                  <Badge variant="outline" className="text-[10px] h-5">Owed</Badge>
                                                )}
                                              </TableCell>
                                            </TableRow>
                                            {isClientExpanded && client.payments && client.payments.map(payment => (
                                              <TableRow key={payment.id} className="bg-white border-l-4 border-l-purple-200">
                                                <TableCell></TableCell>
                                                <TableCell className="pl-8 py-2">
                                                  <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium italic">
                                                    <Calendar className="h-3 w-3" /> {new Date(payment.date).toLocaleDateString()}
                                                  </div>
                                                </TableCell>
                                                <TableCell className="text-[11px] text-gray-500 py-2">
                                                  <div className="flex items-center justify-center gap-1">
                                                    <Receipt className="h-3 w-3" /> {payment.months}
                                                  </div>
                                                </TableCell>
                                                <TableCell className="text-right text-[11px] text-gray-500 py-2">{formatCurrency(payment.amount)}</TableCell>
                                                <TableCell className="text-right text-[11px] text-purple-500 font-medium py-2">
                                                  +{formatCurrency(payment.commission)}
                                                </TableCell>
                                                <TableCell colSpan={2} className="text-right py-1">
                                                  {payment.paid ? (
                                                    <Badge variant="outline" className="text-green-600 text-[9px] font-bold border-green-100">✓ PAID</Badge>
                                                  ) : (
                                                    user?.role !== "AGENT" && (
                                                      <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-6 text-[10px] text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleMarkAsPaid(payment.id, payment.commission, agent.id);
                                                        }}
                                                      >
                                                        Mark Paid
                                                      </Button>
                                                    )
                                                  )}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </React.Fragment>
                                        );
                                      })}
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
