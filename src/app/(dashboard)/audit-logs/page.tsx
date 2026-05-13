"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";
import { ShieldAlert, Shield, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { Label } from "@/components/ui/label";

interface AuditLog {
    id: string;
    userId: string;
    username: string;
    action: string;
    resourceType: string;
    resourceId: string;
    createdAt: string;
    details: string;
    description?: string;
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState<{ key: keyof AuditLog, direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' });
    const [page, setPage] = useState(1);
    const [isCleanupOpen, setIsCleanupOpen] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isCleaning, setIsCleaning] = useState(false);
    
    const { user } = useAuth();
    const isDirectorOrAdmin = ["DIRECTOR", "ADMIN", "GENERAL_MANAGER"].includes(user?.role || "");
    const isDirector = user?.role === "DIRECTOR";
    
    const limit = 10;

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/audit-logs");
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
            }
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleCleanup = async () => {
        if (!startDate || !endDate) return;
        
        setIsCleaning(true);
        try {
            const res = await fetch("/api/audit-logs/cleanup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ startDate, endDate })
            });
            
            if (res.ok) {
                setIsCleanupOpen(false);
                fetchLogs();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to clear logs");
            }
        } catch (error) {
            console.error("Error cleaning logs:", error);
            alert("An error occurred while clearing logs");
        } finally {
            setIsCleaning(false);
        }
    };

    const getActionBadge = (action: string) => {
        switch (action) {
            case "CREATE":
                return <Badge className="bg-green-100 text-green-800 border-green-200">CREATE</Badge>;
            case "UPDATE":
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200">UPDATE</Badge>;
            case "DELETE":
                return <Badge className="bg-red-100 text-red-800 border-red-200">DELETE</Badge>;
            default:
                return <Badge variant="outline">{action}</Badge>;
        }
    };

    const handleSort = (key: keyof AuditLog) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        setPage(1); // Reset page on sort
    };

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        setPage(1); // Reset page on search
    };

    const filteredLogs = logs.filter(log => 
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ((log.description || log.details) && (log.description || log.details).toLowerCase().includes(searchQuery.toLowerCase())) ||
        log.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedLogs = [...filteredLogs].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        
        let aVal = a[key] || '';
        let bVal = b[key] || '';
        
        // Handle sorting for description vs details
        if (key === 'description') {
            aVal = a.description || a.details || '';
            bVal = b.description || b.details || '';
        }

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(sortedLogs.length / limit) || 1;
    const paginatedLogs = sortedLogs.slice((page - 1) * limit, page * limit);

    const SortIcon = ({ columnKey }: { columnKey: keyof AuditLog }) => {
        if (sortConfig?.key !== columnKey) return <ChevronDown className="ml-1 h-3 w-3 opacity-30" />;
        return sortConfig.direction === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="h-6 w-6 text-purple-600" />
                        Audit Logs
                    </h1>
                    <p className="text-gray-500">Track and monitor all administrative actions across the system.</p>
                </div>
                {isDirector && (
                    <Dialog open={isCleanupOpen} onOpenChange={setIsCleanupOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Clear Logs
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Clear Audit Logs</DialogTitle>
                                <DialogDescription>
                                    This will permanently delete audit logs within the selected date range.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="startDate">Start Date</Label>
                                    <Input 
                                        id="startDate" 
                                        type="date" 
                                        value={startDate} 
                                        onChange={(e) => setStartDate(e.target.value)} 
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="endDate">End Date</Label>
                                    <Input 
                                        id="endDate" 
                                        type="date" 
                                        value={endDate} 
                                        onChange={(e) => setEndDate(e.target.value)} 
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCleanupOpen(false)}>Cancel</Button>
                                <Button 
                                    className="bg-red-600 hover:bg-red-700 text-white" 
                                    onClick={handleCleanup}
                                    disabled={!startDate || !endDate || isCleaning}
                                    loading={isCleaning}
                                >
                                    Confirm Clear
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-base font-medium">System Activity</CardTitle>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search logs..."
                                    className="pl-9 w-full sm:w-64"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <ShieldAlert className="h-12 w-12 text-gray-300" />
                            <h3 className="mt-4 text-lg font-medium text-gray-900">No audit logs found</h3>
                            <p className="mt-1 text-gray-500">System activity will appear here once users perform actions.</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort('createdAt')}>
                                            <div className="flex items-center">Date & Time <SortIcon columnKey="createdAt" /></div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort('username')}>
                                            <div className="flex items-center">Username <SortIcon columnKey="username" /></div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort('action')}>
                                            <div className="flex items-center">Action <SortIcon columnKey="action" /></div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer select-none w-full" onClick={() => handleSort('description')}>
                                            <div className="flex items-center">Description <SortIcon columnKey="description" /></div>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                                No logs match your search.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedLogs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="whitespace-nowrap text-sm text-gray-500">
                                                    {formatDateTime(log.createdAt)}
                                                </TableCell>
                                                <TableCell className="text-sm font-medium text-gray-900">
                                                    {log.username}
                                                </TableCell>
                                                <TableCell>{getActionBadge(log.action)}</TableCell>
                                                <TableCell className="text-sm text-gray-700">
                                                    {log.description || log.details || "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                                <p className="text-sm text-gray-500">
                                    Showing {(page - 1) * limit + 1} to{" "}
                                    {Math.min(page * limit, filteredLogs.length)} of{" "}
                                    {filteredLogs.length} logs
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm text-gray-600">
                                        Page {page} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
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
