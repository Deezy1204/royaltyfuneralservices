"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  UserPlus,
  UserMinus,
} from "lucide-react";

interface Alteration {
  id: string;
  alterationNumber: string;
  alterationType: string;
  previousPlan: string | null;
  newPlan: string | null;
  previousPremium: number;
  newPremium: number | null;
  status: string;
  createdAt: string;
  effectiveDate: string | null;
  policy: {
    policyNumber: string;
    planType: string;
    client: {
      firstName: string;
      lastName: string;
      clientNumber: string;
    };
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

const ALTERATION_ICONS: Record<string, typeof ArrowUp> = {
  UPGRADE: ArrowUp,
  DOWNGRADE: ArrowDown,
  ADD_DEPENDENT: UserPlus,
  REMOVE_DEPENDENT: UserMinus,
  ADD_RIDER: Plus,
  REMOVE_RIDER: XCircle,
  CHANGE_PAYMENT: RefreshCw,
  CHANGE_DETAILS: RefreshCw,
};

export default function AlterationsPage() {
  const [alterations, setAlterations] = useState<Alteration[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    pendingReview: 0,
    upgradesMonth: 0,
    downgradesMonth: 0,
    dependentsAdded: 0
  });

  const fetchAlterations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (status !== "all") params.append("status", status);

      const res = await fetch(`/api/alterations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAlterations(data.alterations);
        setPagination(data.pagination);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (error) {
      console.error("Failed to fetch alterations:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, status]);

  useEffect(() => {
    fetchAlterations();
  }, [fetchAlterations]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/alterations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchAlterations();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alterations</h1>
          <p className="text-gray-500">Manage policy alterations and changes</p>
        </div>
        <div className="flex justify-end w-full sm:w-auto">
          <Link href="/alterations/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Alteration
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.pendingReview}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-yellow-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Upgrades (MTD)</p>
                <p className="text-2xl font-bold text-green-600">{summary.upgradesMonth}</p>
              </div>
              <ArrowUp className="h-8 w-8 text-green-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Downgrades (MTD)</p>
                <p className="text-2xl font-bold text-orange-600">{summary.downgradesMonth}</p>
              </div>
              <ArrowDown className="h-8 w-8 text-orange-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Dependents Added</p>
                <p className="text-2xl font-bold text-blue-600">{summary.dependentsAdded}</p>
              </div>
              <UserPlus className="h-8 w-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
            <CardTitle className="text-base font-medium">Alteration Requests</CardTitle>
            <div className="flex justify-end w-full sm:w-auto">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
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
          ) : alterations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <RefreshCw className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No alterations found</h3>
              <p className="mt-1 text-gray-500">Create a new alteration request</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alteration #</TableHead>
                    <TableHead>Client / Policy</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Premium Change</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alterations.map((alt) => {
                    const Icon = ALTERATION_ICONS[alt.alterationType] || RefreshCw;
                    return (
                      <TableRow key={alt.id}>
                        <TableCell className="font-medium text-purple-600">
                          {alt.alterationNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">
                              {alt.policy.client.firstName} {alt.policy.client.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{alt.policy.policyNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">
                              {alt.alterationType.replace(/_/g, " ")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {alt.previousPlan && alt.newPlan ? (
                            <div className="flex items-center gap-2">
                              <Badge className={PLAN_COLORS[alt.previousPlan]}>
                                {alt.previousPlan}
                              </Badge>
                              <span className="text-gray-400">→</span>
                              <Badge className={PLAN_COLORS[alt.newPlan]}>
                                {alt.newPlan}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {alt.newPremium ? (
                            <div>
                              <p className="text-gray-500 line-through text-xs">
                                {formatCurrency(alt.previousPremium)}
                              </p>
                              <p className="font-medium text-green-600">
                                {formatCurrency(alt.newPremium)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[alt.status]}>
                            {alt.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {formatDate(alt.createdAt)}
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
                                <Link href={`/alterations/${alt.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {alt.status === "SUBMITTED" && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(alt.id, "UNDER_REVIEW")}
                                >
                                  <Eye className="mr-2 h-4 w-4 text-purple-600" />
                                  Start Review
                                </DropdownMenuItem>
                              )}
                              {alt.status === "UNDER_REVIEW" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(alt.id, "APPROVED")}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(alt.id, "REJECTED")}
                                    className="text-red-600"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {alt.status === "APPROVED" && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(alt.id, "APPLIED")}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Apply Changes
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} alterations
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
