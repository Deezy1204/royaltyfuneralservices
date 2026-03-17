"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, FileText, Calendar, CheckCircle, ShieldCheck, ShieldAlert, Clock, FileCheck, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { differenceInDays } from "date-fns";

const SERVICES_MAP: Record<string, string> = {
    bodyRemoval: "Body Removal",
    groceryAllowance: "Grocery Allowance",
    airtimeAllowance: "Airtime Allowance",
    mortuaryServices: "Mortuary Services",
    transportForMourners: "Transport for Mourners",
    hearseTrailer: "Hearse / Trailer",
    gravesiteEquipment: "Gravesite Equipment",
    cashBack: "Cash Back (Cash Plan)",
    cashInLeau: "Cash-in-leau",
};

const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    PAID: "bg-emerald-100 text-emerald-800",
    UNDER_REVIEW: "bg-blue-100 text-blue-800",
};

export default function DeclarationDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [declaration, setDeclaration] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [userRole, setUserRole] = useState<string>("");

    useEffect(() => {
        fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(d => {
            if (d?.user) setUserRole(d.user.role);
        });
    }, []);

    useEffect(() => {
        const fetchDeclaration = async () => {
            if (!params.id) return;
            try {
                const res = await fetch(`/api/declarations/${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setDeclaration(data.declaration);
                }
            } catch (error) {
                console.error("Failed to fetch declaration:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDeclaration();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            </div>
        );
    }

    if (!declaration) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <h3 className="mt-4 text-lg font-medium text-gray-900">Declaration not found</h3>
                <p className="mt-1 text-gray-500">The declaration you are looking for does not exist.</p>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>Back to Declarations</Button>
            </div>
        );
    }

    const handleApproval = async (status: "APPROVED" | "REJECTED") => {
        setUpdating(true);
        try {
            const res = await fetch(`/api/declarations/${declaration.id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                const now = new Date().toISOString();
                setDeclaration({
                    ...declaration,
                    status,
                    approvedAt: status === "APPROVED" ? now : undefined,
                    rejectedAt: status === "REJECTED" ? now : undefined,
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this declaration? This action cannot be undone.")) return;
        try {
            const res = await fetch(`/api/declarations/${declaration.id}`, { method: "DELETE" });
            if (res.ok) router.push("/declarations");
        } catch (error) {
            console.error("Failed to delete declaration:", error);
        }
    };

    const isAdmin = userRole === "ADMIN";
    const statusLabel = declaration.status
        ? declaration.status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
        : "Pending";

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Declaration #{declaration.declarationNumber}
                        </h1>
                        <p className="text-gray-500">
                            Submitted on {formatDate(declaration.createdAt)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge className={STATUS_COLORS[declaration.status] || "bg-gray-100 text-gray-800"}>
                        {statusLabel}
                    </Badge>
                    {isAdmin && (
                        <Button variant="destructive" size="sm" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    )}
                </div>
            </div>

            {/* Principal Member Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Principal Member's Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Full Name</p>
                        <p className="text-base text-gray-900">{declaration.declarantName || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">ID Number</p>
                        <p className="text-base text-gray-900">{declaration.declarantIdNumber || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Relationship to Deceased</p>
                        <p className="text-base text-gray-900">{declaration.declarantRelation || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Phone</p>
                        <p className="text-base text-gray-900">{declaration.declarantPhone || declaration.client?.phone || "N/A"}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Deceased Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-gray-600" />
                        Details of the Deceased
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Name</p>
                        <p className="text-base text-gray-900">{declaration.deceasedName || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">ID / BC Number</p>
                        <p className="text-base text-gray-900">{declaration.deceasedIdNumber || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Date of Death</p>
                        <p className="text-base text-gray-900">{declaration.deceasedDOD ? formatDate(declaration.deceasedDOD) : "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Relationship to Policy Holder</p>
                        <p className="text-base text-gray-900">{declaration.declarantRelation || "N/A"}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Services */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-purple-600" />
                        Services Provided
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {declaration.servicesRendered && Object.entries(declaration.servicesRendered).map(([key, value]) => {
                            if (!value) return null;
                            return (
                                <div key={key} className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm text-gray-800">{SERVICES_MAP[key] || key}</span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Declaration Signatures */}
            <Card className="bg-blue-50/50 border-blue-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Declaration Signatures
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-700 italic border-l-4 border-blue-400 pl-4 py-2">
                        I <span className="font-bold">{declaration.declarantName}</span> of ID No. <span className="font-bold">{declaration.declarantIdNumber}</span> do hereby declare that all the information provided by me is correct.
                    </p>
                </CardContent>
            </Card>

            {/* === TIMELINE + VERIFICATION SIDE BY SIDE === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

                {/* TIMELINE */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-amber-600" />
                            Timeline &amp; Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                            {/* Submitted */}
                            <div className="relative flex items-center gap-4 group is-active">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-purple-600 text-slate-500 group-[.is-active]:text-purple-50 shadow shrink-0">
                                    <FileCheck className="w-4 h-4" />
                                </div>
                                <div className="flex-1 bg-white p-3 rounded border border-slate-200 shadow">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="font-bold text-slate-900">Submitted</div>
                                        <time className="font-medium text-indigo-500 text-xs">{declaration.createdAt ? new Date(declaration.createdAt).toLocaleString() : "N/A"}</time>
                                    </div>
                                    <div className="text-slate-500 text-sm">Declaration submitted</div>
                                </div>
                            </div>
                            {/* Approved */}
                            {declaration.approvedAt && (
                                <div className="relative flex items-center gap-4 group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-green-600 text-slate-500 group-[.is-active]:text-green-50 shadow shrink-0">
                                        <FileCheck className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 bg-white p-3 rounded border border-slate-200 shadow">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="font-bold text-slate-900">Approved</div>
                                            <time className="font-medium text-indigo-500 text-xs">{new Date(declaration.approvedAt).toLocaleString()}</time>
                                        </div>
                                        <div className="text-slate-500 text-sm">Declaration approved — claim marked as Paid</div>
                                    </div>
                                </div>
                            )}
                            {/* Rejected */}
                            {declaration.rejectedAt && (
                                <div className="relative flex items-center gap-4 group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-red-600 text-slate-500 group-[.is-active]:text-red-50 shadow shrink-0">
                                        <FileCheck className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 bg-white p-3 rounded border border-slate-200 shadow">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="font-bold text-slate-900">Rejected</div>
                                            <time className="font-medium text-indigo-500 text-xs">{new Date(declaration.rejectedAt).toLocaleString()}</time>
                                        </div>
                                        <div className="text-slate-500 text-sm">Declaration was rejected</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* VERIFICATION PROCESS */}
                <Card className="border-purple-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-purple-600" />
                            Verification Process
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(() => {
                            const policies = declaration.client?.policies || [];
                            if (policies.length > 0) {
                                const firstPolicy = [...policies].sort((a, b) =>
                                    new Date(a.inceptionDate || a.createdAt).getTime() - new Date(b.inceptionDate || b.createdAt).getTime()
                                )[0];
                                const start = new Date(firstPolicy.inceptionDate || firstPolicy.createdAt);
                                const daysPassed = differenceInDays(new Date(), start);
                                const daysLeft = 90 - daysPassed;

                                if (daysLeft > 0) {
                                    return (
                                        <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                            <Clock className="h-6 w-6 text-orange-600 shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-orange-900">Waiting Period</h4>
                                                <p className="text-sm text-orange-700">{daysLeft} days remaining until full coverage.</p>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                            <ShieldCheck className="h-6 w-6 text-green-600 shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-green-900">Full Member</h4>
                                                <p className="text-sm text-green-700">Client has completed the waiting period and is fully covered.</p>
                                            </div>
                                        </div>
                                    );
                                }
                            } else {
                                return (
                                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <ShieldAlert className="h-6 w-6 text-red-600 shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-red-900">No Active Policies</h4>
                                            <p className="text-sm text-red-700">Client does not have any recorded policies.</p>
                                        </div>
                                    </div>
                                );
                            }
                        })()}

                        {isAdmin && (
                            (!declaration.status || declaration.status === "PENDING") ? (
                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <Button onClick={() => handleApproval("APPROVED")} disabled={updating} className="bg-green-600 hover:bg-green-700">
                                        {updating ? "Processing..." : "Approve"}
                                    </Button>
                                    <Button onClick={() => handleApproval("REJECTED")} disabled={updating} variant="destructive">
                                        {updating ? "Processing..." : "Reject"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-sm font-medium text-gray-500">
                                        Processed and marked as <span className={`font-bold ${declaration.status === "APPROVED" ? "text-green-600" : "text-red-600"}`}>{statusLabel}</span>.
                                    </p>
                                </div>
                            )
                        )}

                        {!isAdmin && (
                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-sm text-gray-400 italic">Only admins can approve or reject declarations.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
