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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatCurrency, STATUS_COLORS, PLAN_COLORS } from "@/lib/utils";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  DollarSign,
  FileSignature,
  Trash2,
} from "lucide-react";

interface Claim {
  id: string;
  claimNumber: string;
  deceasedName: string;
  deceasedType: string;
  dateOfDeath: string;
  causeOfDeath: string;
  claimAmount: number;
  approvedAmount: number | null;
  status: string;
  createdAt: string;
  client: {
    clientNumber: string;
    firstName: string;
    lastName: string;
  };
  policy: {
    policyNumber: string;
    planType: string;
    coverAmount: number;
  };
  createdBy: {
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

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "paid", label: "Paid" },
];

const formatStatus = (status: string) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [summaryStats, setSummaryStats] = useState({ pending: 0, underReview: 0, paid: 0, paidAmount: 0 });
  const [userRole, setUserRole] = useState<string>("");

  // Fetch current user role
  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.user) setUserRole(d.user.role);
    });
  }, []);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.append("search", search);
      if (status !== "all") params.append("status", status);

      const res = await fetch(`/api/claims?${params}`);
      if (res.ok) {
        const data = await res.json();
        setClaims(data.claims);
        setPagination(data.pagination);
        if (data.summary) setSummaryStats({
          pending: data.summary.pending || 0,
          underReview: data.summary.underReview || 0,
          paid: data.summary.paid || 0,
          paidAmount: data.summary.paidAmount || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch claims:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, status]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchClaims();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchClaims]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/claims/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchClaims();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this claim? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/claims/${id}`, { method: "DELETE" });
      if (res.ok) fetchClaims();
    } catch (error) {
      console.error("Failed to delete claim:", error);
    }
  };

  const isAdmin = userRole === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Claims</h1>
          <p className="text-gray-500">Process and manage funeral claims</p>
        </div>
        <Link href="/claims/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Claim
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Claims</p>
                <p className="text-2xl font-bold text-yellow-600">{summaryStats.pending}</p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Under Review</p>
                <p className="text-2xl font-bold text-purple-600">{summaryStats.underReview}</p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Paid Claims</p>
                <p className="text-2xl font-bold text-green-600">{summaryStats.paid}</p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Paid (Total)</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summaryStats.paidAmount)}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-medium">Claims List</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search claims..."
                  className="pl-9 w-full sm:w-64"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            </div>
          ) : claims.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileCheck className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No claims found</h3>
              <p className="mt-1 text-gray-500">Submit a new claim to get started</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim #</TableHead>
                    <TableHead>Policyholder</TableHead>
                    <TableHead>Deceased</TableHead>
                    <TableHead>Date of Death</TableHead>
                    <TableHead>Claim Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-medium text-purple-600">
                        {claim.claimNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {claim.client.firstName} {claim.client.lastName}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge className={PLAN_COLORS[claim.policy.planType]}>
                              {claim.policy.planType}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {claim.policy.policyNumber}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{claim.deceasedName}</p>
                          <p className="text-xs text-gray-500">
                            {claim.deceasedType === "PRINCIPAL" ? "Principal Member" : "Dependent"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(claim.dateOfDeath)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(claim.claimAmount)}
                          </p>
                          {claim.approvedAmount && (
                            <p className="text-xs text-green-600">
                              Approved: {formatCurrency(claim.approvedAmount)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[claim.status]}>
                          {formatStatus(claim.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {formatDate(claim.createdAt)}
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
                              <Link href={`/claims/${claim.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {claim.status === "PENDING" && (
                              <>
                                <DropdownMenuItem asChild>
                                  <Link href={`/claims/new?claimId=${claim.id}&step=declaration`}>
                                    <FileSignature className="mr-2 h-4 w-4 text-blue-600" />
                                    Proceed to Declaration
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(claim.id, "UNDER_REVIEW")}
                                >
                                  <AlertCircle className="mr-2 h-4 w-4 text-purple-600" />
                                  Start Review
                                </DropdownMenuItem>
                              </>
                            )}
                            {claim.status === "UNDER_REVIEW" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(claim.id, "APPROVED")}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve Claim
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(claim.id, "REJECTED")}
                                  className="text-red-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject Claim
                                </DropdownMenuItem>
                              </>
                            )}
                            {claim.status === "APPROVED" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(claim.id, "PAID")}
                                className="text-green-600"
                              >
                                <DollarSign className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            {isAdmin && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(claim.id)}
                                  className="text-red-600 focus:text-red-700"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Claim
                                </DropdownMenuItem>
                              </>
                            )}
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
                  {pagination.total} claims
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
    </div>
  );
}
