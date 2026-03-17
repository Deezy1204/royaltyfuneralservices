"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    FileText,
    User,
    CreditCard,
    Users,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    Printer,
    Download
} from "lucide-react";
import { formatDate, formatCurrency, STATUS_COLORS, PLAN_COLORS } from "@/lib/utils";

interface Proposal {
    id: string;
    proposalNumber: string;
    clientFirstName: string;
    clientLastName: string;
    clientIdNumber: string;
    clientTitle: string;
    clientDOB: string;
    clientGender: string;
    clientPhone: string;
    clientEmail: string;
    clientAddress: string;
    clientCity: string;
    clientPostalCode: string;
    planType: string;
    policyType: string;
    proposedCover: number;
    proposedPremium: number;
    paymentFrequency: string;
    paymentMethod: string;
    bankName?: string;
    accountNumber?: string;
    branchCode?: string;
    debitOrderDay?: number;
    status: string;
    createdAt: string;
    notes?: string;
    dependentsData?: string;
    agent?: {
        firstName: string;
        lastName: string;
    };
}

export default function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProposal = async () => {
            try {
                const res = await fetch(`/api/proposals/${id}`);
                if (!res.ok) {
                    if (res.status === 404) throw new Error("Proposal not found");
                    throw new Error("Failed to fetch proposal");
                }
                const data = await res.json();
                setProposal({ id: data.proposal.id, ...data.proposal });
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchProposal();
    }, [id]);

    const handleStatusChange = async (newStatus: string) => {
        try {
            const res = await fetch(`/api/proposals/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                const data = await res.json();
                setProposal(data.proposal);
            }
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            </div>
        );
    }

    if (error || !proposal) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <XCircle className="h-12 w-12 text-red-500" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">{error || "Proposal not found"}</h3>
                <Link href="/proposals" className="mt-4">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Proposals
                    </Button>
                </Link>
            </div>
        );
    }

    const dependents = proposal.dependentsData ? JSON.parse(proposal.dependentsData) : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/proposals" className="print:hidden">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">Proposal {proposal.proposalNumber}</h1>
                            <Badge className={STATUS_COLORS[proposal.status]}>
                                {proposal.status.replace("_", " ")}
                            </Badge>
                        </div>
                        <p className="text-gray-500">Created on {formatDate(proposal.createdAt)}</p>
                    </div>
                </div>
                <div className="flex gap-2 print:hidden">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                    {proposal.status === "SUBMITTED" && (
                        <Button onClick={() => handleStatusChange("UNDER_REVIEW")}>
                            Start Review
                        </Button>
                    )}
                    {proposal.status === "UNDER_REVIEW" && (
                        <>
                            <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleStatusChange("REJECTED")}>
                                Reject
                            </Button>
                            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange("APPROVED")}>
                                Approve
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Client Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <User className="h-5 w-5 text-purple-600" />
                                Principal Member Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <p className="text-sm text-gray-500">Full Name</p>
                                <p className="font-medium text-gray-900">
                                    {proposal.clientTitle} {proposal.clientFirstName} {proposal.clientLastName}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">ID Number</p>
                                <p className="font-medium text-gray-900">{proposal.clientIdNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Gender</p>
                                <p className="font-medium text-gray-900">{proposal.clientGender}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Date of Birth</p>
                                <p className="font-medium text-gray-900">{formatDate(proposal.clientDOB)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="font-medium text-gray-900">{proposal.clientPhone}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium text-gray-900">{proposal.clientEmail || "Not provided"}</p>
                            </div>
                            <div className="sm:col-span-2">
                                <p className="text-sm text-gray-500">Address</p>
                                <p className="font-medium text-gray-900">
                                    {proposal.clientAddress}, {proposal.clientCity}, {proposal.clientPostalCode}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dependents */}
                    {proposal.policyType === "FAMILY" && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Users className="h-5 w-5 text-purple-600" />
                                    Dependents ({dependents.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {dependents.length === 0 ? (
                                    <p className="text-gray-500 italic">No dependents listed</p>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {dependents.map((dep: any, idx: number) => (
                                            <div key={idx} className="py-4 first:pt-0 last:pb-0">
                                                <div className="grid gap-4 sm:grid-cols-3">
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Name</p>
                                                        <p className="font-medium text-gray-900">{dep.firstName} {dep.lastName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wider">ID Number</p>
                                                        <p className="text-gray-900">{dep.idNumber || "N/A"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Relationship</p>
                                                        <Badge variant="outline" className="mt-1">{dep.relationship}</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Notes */}
                    {proposal.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Additional Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 whitespace-pre-wrap">{proposal.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Plan Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="h-5 w-5 text-purple-600" />
                                Plan Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Plan Type</span>
                                <Badge className={PLAN_COLORS[proposal.planType]}>{proposal.planType}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Policy Type</span>
                                <span className="font-medium">{proposal.policyType}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Cover Amount</span>
                                <span className="font-bold text-gray-900">{formatCurrency(proposal.proposedCover)}</span>
                            </div>
                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-900">Monthly Premium</span>
                                <span className="text-xl font-bold text-purple-700">{formatCurrency(proposal.proposedPremium)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <CreditCard className="h-5 w-5 text-purple-600" />
                                Payment Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Method</span>
                                <span className="font-medium text-gray-900">{proposal.paymentMethod.replace("_", " ")}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Frequency</span>
                                <span className="font-medium text-gray-900">{proposal.paymentFrequency}</span>
                            </div>
                            {proposal.paymentMethod === "DEBIT_ORDER" && (
                                <div className="pt-4 border-t border-gray-100 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Bank</span>
                                        <span>{proposal.bankName}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Account</span>
                                        <span>{proposal.accountNumber}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Debit Day</span>
                                        <span>{proposal.debitOrderDay}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Agent Info */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <User className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Assigned Agent</p>
                                    <p className="font-medium text-gray-900">
                                        {proposal.agent ? `${proposal.agent.firstName} ${proposal.agent.lastName}` : "Unknown"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
