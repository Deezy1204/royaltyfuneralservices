"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Search, FileSignature, Eye, MoreHorizontal, Trash2, CheckCircle, XCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useLoading } from "@/components/providers/LoadingProvider";

interface Declaration {
    id: string;
    declarationNumber: string;
    clientId: string;
    declarantName: string;
    deceasedName: string;
    deceasedIdNumber: string;
    deceasedDOD: string;
    createdAt: string;
    status: string;
}

const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    PAID: "bg-emerald-100 text-emerald-800",
    UNDER_REVIEW: "bg-blue-100 text-blue-800",
};

export default function DeclarationsPage() {
    const { startLoading, stopLoading } = useLoading();
    const [declarations, setDeclarations] = useState<Declaration[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [userRole, setUserRole] = useState<string>("");

    useEffect(() => {
        fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(d => {
            if (d?.user) setUserRole(d.user.role);
        });
    }, []);

    const fetchDeclarations = useCallback(async (silent = false) => {
        if (!silent) startLoading("Fetching declarations...");
        try {
            const res = await fetch("/api/declarations");
            if (res.ok) {
                const data = await res.json();
                setDeclarations(data.declarations);
            }
        } catch (error) {
            console.error("Failed to fetch declarations:", error);
        } finally {
            if (!silent) stopLoading();
        }
    }, [startLoading, stopLoading]);

    useEffect(() => {
        fetchDeclarations();
    }, [fetchDeclarations]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this declaration? This action cannot be undone.")) return;
        try {
            const res = await fetch(`/api/declarations/${id}`, { method: "DELETE" });
            if (res.ok) fetchDeclarations();
        } catch (error) {
            console.error("Failed to delete declaration:", error);
        }
    };

    const isAdmin = ["ADMIN", "DIRECTOR", "GENERAL_MANAGER"].includes(userRole);

    const handleStatusChange = async (id: string, newStatus: string) => {
        if (!confirm(`Are you sure you want to ${newStatus.toLowerCase()} this declaration?`)) return;
        
        startLoading(newStatus === "APPROVED" ? "Approving Declaration..." : "Rejecting Declaration...");
        try {
            const res = await fetch(`/api/declarations/${id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                fetchDeclarations();
            }
        } catch (error) {
            console.error("Failed to update status:", error);
        } finally {
            stopLoading();
        }
    };

    const filteredDeclarations = declarations.filter(
        (d) =>
            d.declarationNumber?.toLowerCase().includes(search.toLowerCase()) ||
            d.declarantName?.toLowerCase().includes(search.toLowerCase()) ||
            d.deceasedName?.toLowerCase().includes(search.toLowerCase()) ||
            d.deceasedIdNumber?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Declarations</h1>
                    <p className="text-gray-500">View submitted death declarations</p>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-base font-medium">Recent Declarations</CardTitle>
                        <div className="flex items-center">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search..."
                                    className="pl-9 w-full sm:w-64"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredDeclarations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FileSignature className="h-12 w-12 text-gray-300" />
                            <h3 className="mt-4 text-lg font-medium text-gray-900">No declarations found</h3>
                            <p className="mt-1 text-gray-500">Submit a new declaration to get started</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Declaration #</TableHead>
                                    <TableHead>Declarant</TableHead>
                                    <TableHead>Deceased</TableHead>
                                    <TableHead>Date of Death</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Submitted On</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDeclarations.map((dec) => (
                                    <TableRow key={dec.id}>
                                        <TableCell className="font-medium text-purple-600">
                                            {dec.declarationNumber}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium text-gray-900">{dec.declarantName}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-gray-900">{dec.deceasedName}</p>
                                                <p className="text-xs text-gray-500">ID: {dec.deceasedIdNumber}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                            {formatDate(dec.deceasedDOD)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={STATUS_COLORS[dec.status] || "bg-gray-100 text-gray-800"}>
                                                {dec.status
                                                    ? dec.status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
                                                    : "Pending"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-500 text-sm">
                                            {formatDate(dec.createdAt)}
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
                                                        <Link href={`/declarations/${dec.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    {isAdmin && dec.status === "PENDING" && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleStatusChange(dec.id, "APPROVED")}
                                                                className="text-green-600 font-semibold"
                                                            >
                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                                Approve Declaration
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleStatusChange(dec.id, "REJECTED")}
                                                                className="text-red-600 font-semibold"
                                                            >
                                                                <XCircle className="mr-2 h-4 w-4" />
                                                                Reject Declaration
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    {isAdmin && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(dec.id)}
                                                                className="text-red-600 focus:text-red-700"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete Declaration
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
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
