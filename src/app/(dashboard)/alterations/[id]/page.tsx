
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    Clock,
    User,
    FileText,
    ArrowRight,
    AlertTriangle,
    Check
} from "lucide-react";
import { formatDate, formatCurrency, STATUS_COLORS } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { ShareDocumentButton } from "@/components/ui/ShareDocumentButton";
import { useLoading } from "@/components/providers/LoadingProvider";

export default function AlterationDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { startLoading, stopLoading } = useLoading();
    const [alteration, setAlteration] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAlteration = async () => {
            try {
                const res = await fetch(`/api/alterations/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setAlteration(data.alteration);
                } else {
                    setError("Failed to load alteration details");
                }
            } catch (err) {
                setError("An error occurred while fetching data");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchAlteration();
    }, [id]);

    const handleAction = async (status: string) => {
        if (!confirm(`Are you sure you want to ${status.toLowerCase()} this alteration?`)) return;

        startLoading(status === "APPROVED" ? "Applying Changes..." : "Rejecting Alteration...");
        setUpdating(true);
        try {
            const res = await fetch(`/api/alterations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });

            if (res.ok) {
                // Refresh data
                const updatedRes = await fetch(`/api/alterations/${id}`);
                const updatedData = await updatedRes.json();
                setAlteration(updatedData.alteration);
            } else {
                const data = await res.json();
                alert(data.error || "Failed to update alteration");
            }
        } catch (err) {
            alert("An error occurred while updating");
        } finally {
            setUpdating(false);
            stopLoading();
        }
    };

    if (loading) return <div className="flex h-64 items-center justify-center">Loading details...</div>;
    if (error) return <div className="p-4 text-red-500 bg-red-50 rounded-lg">{error}</div>;
    if (!alteration) return <div className="p-4">Alteration not found</div>;

    const previousValues = alteration.previousValues ? JSON.parse(alteration.previousValues) : {};
    const newValues = alteration.newValues ? JSON.parse(alteration.newValues) : {};

    return (
        <div className="space-y-6 pb-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/alterations">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Alteration #{alteration.alterationNumber}</h1>
                        <p className="text-gray-500">Submitted on {formatDate(alteration.createdAt)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ShareDocumentButton 
                        title={`Alteration #${alteration.alterationNumber}`} 
                        text={`Hello ${alteration.policy?.client?.firstName},\n\nHere is a link to your Royalty Funeral Services Alteration Request #${alteration.alterationNumber}.`}
                    />
                    <Badge className={STATUS_COLORS[alteration.status] || "bg-gray-100 text-gray-800"}>
                        {alteration.status}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Info */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-purple-600" />
                            Change Details - {alteration.alterationType}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Before</h3>
                                {Object.keys(previousValues).length > 0 ? (
                                    Object.entries(previousValues).map(([key, value]) => (
                                        <div key={key}>
                                            <p className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                                            <p className="font-semibold text-gray-700">
                                                {key.toLowerCase().includes('amount') || key.toLowerCase().includes('premium') || key.toLowerCase().includes('cover')
                                                    ? formatCurrency(value as number)
                                                    : String(value)}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm italic text-gray-400">No previous state recorded</p>
                                )}
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                                    After <ArrowRight className="h-3 w-3" />
                                </h3>
                                {Object.keys(newValues).length > 0 ? (
                                    Object.entries(newValues).map(([key, value]) => (
                                        <div key={key}>
                                            <p className="text-xs text-blue-500 capitalize font-medium">{key.replace(/([A-Z])/g, ' $1')}</p>
                                            <p className="font-bold text-blue-900">
                                                {key.toLowerCase().includes('amount') || key.toLowerCase().includes('premium') || key.toLowerCase().includes('cover')
                                                    ? formatCurrency(value as number)
                                                    : String(value)}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm italic text-gray-400">No new state recorded</p>
                                )}
                            </div>
                        </div>

                        {alteration.notes && (
                            <div className="border-t pt-4">
                                <p className="text-sm font-medium text-gray-500 mb-1">Requester Notes</p>
                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                                    "{alteration.notes}"
                                </p>
                            </div>
                        )}

                        {alteration.adminNotes && (
                            <div className="border-t pt-4">
                                <p className="text-sm font-medium text-purple-600 mb-1">Admin Response</p>
                                <p className="text-sm text-gray-700 bg-purple-50 p-3 rounded-lg border border-purple-100">
                                    {alteration.adminNotes}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold text-gray-500 uppercase">Policy Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-500">Policy Number</p>
                                <p className="font-bold text-gray-900">{alteration.policy?.policyNumber}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Plan Type</p>
                                <p className="font-medium text-gray-700">{alteration.policy?.planType}</p>
                            </div>
                            <div className="pt-2 border-t">
                                <p className="text-xs text-gray-500 flex items-center gap-1"><User className="h-3 w-3" /> Policy Holder</p>
                                <p className="font-bold text-gray-900">{alteration.policy?.client?.firstName} {alteration.policy?.client?.lastName}</p>
                                <p className="text-xs text-gray-500">#{alteration.policy?.client?.clientNumber}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold text-gray-500 uppercase">Audit Trail</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-3">
                                <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-gray-900">Submitted</p>
                                    <p className="text-xs text-gray-500">By {alteration.createdBy?.firstName} {alteration.createdBy?.lastName}</p>
                                    <p className="text-[10px] text-gray-400">{formatDate(alteration.createdAt)}</p>
                                </div>
                            </div>
                            {alteration.status !== "SUBMITTED" && alteration.status !== "PENDING" && (
                                <div className="flex gap-3 border-t pt-3">
                                    <CheckCircle className={`h-4 w-4 mt-0.5 ${alteration.status === 'APPROVED' ? 'text-green-500' : 'text-red-500'}`} />
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">{alteration.status === 'APPROVED' ? 'Approved' : 'Rejected'}</p>
                                        <p className="text-xs text-gray-500">By {alteration.approvedBy?.firstName} {alteration.approvedBy?.lastName}</p>
                                        <p className="text-[10px] text-gray-400">{formatDate(alteration.approvedAt)}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Admin Actions */}
                    {["ADMIN", "DIRECTOR", "GENERAL_MANAGER"].includes(user?.role || "") && (alteration.status === "SUBMITTED" || alteration.status === "PENDING") && (
                        <div className="space-y-3">
                            <Button
                                className="w-full bg-green-600 hover:bg-green-700"
                                onClick={() => handleAction("APPROVED")}
                                disabled={updating}
                            >
                                <Check className="mr-2 h-4 w-4" /> Approve Alteration
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleAction("REJECTED")}
                                disabled={updating}
                            >
                                <XCircle className="mr-2 h-4 w-4" /> Reject Alteration
                            </Button>
                            <p className="text-[10px] text-center text-gray-400 px-2 italic">
                                Approving this will immediately update the policy details in the database.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
