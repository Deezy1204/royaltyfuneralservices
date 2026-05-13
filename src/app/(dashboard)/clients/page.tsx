"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatCurrency, PLAN_COLORS, getJoinedDate } from "@/lib/utils";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  FileText,
  CreditCard,
  Users,
  ChevronLeft,
  ChevronRight,
  Clock,
  Shield,
  FileSpreadsheet,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClientImportDialog } from "@/components/clients/ClientImportDialog";
import { differenceInDays } from "date-fns";
import { useLoading } from "@/components/providers/LoadingProvider";

interface Policy {
  id: string;
  policyNumber: string;
  planType: string;
  status: string;
  premiumAmount: number;
  inceptionDate?: string;
  createdAt: string;
}

interface Client {
  id: string;
  clientNumber: string;
  title: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  phone: string;
  email: string;
  city: string;
  isActive: boolean;
  createdAt: string;
  policies: Policy[];
  _count: {
    dependents: number;
    claims: number;
  };
  agent?: {
    firstName: string;
    lastName: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("regular");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const { startLoading, stopLoading } = useLoading();

  const fetchClients = useCallback(async (silent = false) => {
    if (!silent) startLoading("Fetching clients...");
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        type: activeTab,
      });
      if (search) params.append("search", search);
      if (status !== "all") params.append("status", status);

      const res = await fetch(`/api/clients?${params}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    } finally {
      if (!silent) stopLoading();
    }
  }, [pagination.page, pagination.limit, search, status, activeTab, startLoading, stopLoading]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchClients();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchClients]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500">Manage client records and policies</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Upload Excel
          </Button>
        </div>
      </div>

      <Tabs defaultValue="regular" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="regular">Clients</TabsTrigger>
          <TabsTrigger value="old">Old Clients</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-6">

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-medium">Client List</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search clients..."
                  className="pl-9 w-full sm:w-64"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No clients found</h3>
              <p className="mt-1 text-gray-500">
                {search ? "Try adjusting your search criteria" : "Get started by adding a new client"}
              </p>

            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>ID Number</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Policy Plan</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Member Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {client.title} {client.firstName} {client.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{client.clientNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{client.idNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-gray-900">{client.phone}</p>
                          <p className="text-xs text-gray-500">{client.email || "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.policies.length > 0 ? (
                          <div className="space-y-1">
                            {client.policies.slice(0, 2).map((policy) => (
                              <Badge
                                key={policy.id}
                                className={PLAN_COLORS[policy.planType]}
                              >
                                {policy.planType}
                              </Badge>
                            ))}
                            {client.policies.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{client.policies.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No policy</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.agent ? (
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">
                              {client.agent.firstName} {client.agent.lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">No Agent</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.isActive ? "success" : "secondary"}>
                          {client.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          if (client.policies && client.policies.length > 0) {
                            const firstPolicy = [...client.policies].sort((a, b) =>
                              new Date(a.inceptionDate || a.createdAt).getTime() - new Date(b.inceptionDate || b.createdAt).getTime()
                            )[0];
                            const start = new Date(firstPolicy.inceptionDate || firstPolicy.createdAt);
                            const daysPassed = differenceInDays(new Date(), start);
                            const daysLeft = 90 - daysPassed;

                            if (daysLeft > 0) {
                              return (
                                <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">
                                  <Clock className="mr-1 w-3 h-3" /> Waiting Period ({daysLeft} days)
                                </Badge>
                              );
                            } else {
                              return (
                                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                                  <Shield className="mr-1 w-3 h-3" /> Full Member
                                </Badge>
                              );
                            }
                          } else {
                            return (
                              <Badge variant="outline" className="text-gray-500 bg-gray-50 border-gray-200">
                                No Policies
                              </Badge>
                            )
                          }
                        })()}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {formatDate(getJoinedDate(client))}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/clients/${client.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/payments/new?clientId=${client.id}`}>
                                <CreditCard className="mr-2 h-4 w-4 text-blue-600" />
                                Record Payment
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/clients/${client.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4 text-purple-600" />
                                Edit Details
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} clients
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      </TabsContent>
      </Tabs>

      <ClientImportDialog 
        open={isImportDialogOpen} 
        onOpenChange={setIsImportDialogOpen}
        onImportComplete={() => fetchClients()}
      />
    </div>
  );
}
