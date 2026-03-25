"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft, CheckCircle2, XCircle, Clock, FileText, User,
    Calendar, FileDigit, Building, Printer, FileCheck, MapPin, FileSignature, ArrowRightLeft, ShieldAlert
} from "lucide-react";
import { formatDate, formatCurrency, STATUS_COLORS, PLAN_COLORS } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ShareDocumentButton } from "@/components/ui/ShareDocumentButton";

export default function ClaimDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [claim, setClaim] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionSubmitting, setActionSubmitting] = useState(false);
    const [selectedTarget, setSelectedTarget] = useState<string>("");

    useEffect(() => {
        const fetchClaim = async () => {
            if (!params.id) return;
            try {
                const res = await fetch(`/api/claims/${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setClaim(data.claim);
                }
            } catch (error) {
                console.error("Failed to fetch claim:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClaim();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            </div>
        );
    }

    if (!claim) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <h3 className="mt-4 text-lg font-medium text-gray-900">Claim not found</h3>
                <p className="mt-1 text-gray-500">The claim you are looking for does not exist.</p>
                <Link href="/claims" className="mt-4">
                    <Button variant="outline">Back to Claims</Button>
                </Link>
            </div>
        );
    }

    const handlePolicyAction = async (action: "TERMINATE" | "TRANSFER") => {
        if (action === "TRANSFER" && !selectedTarget) {
            toast.error("Please select a dependent or beneficiary to transfer the policy to.");
            return;
        }

        let targetPayload = null;
        if (action === "TRANSFER") {
            const [type, id] = selectedTarget.split(":");
            let targetData = null;
            if (type === "DEPENDENT") {
                targetData = claim.policy?.dependents?.[id];
            } else {
                targetData = claim.policy?.beneficiaries?.[id];
            }
            targetPayload = { type, id, data: targetData };
        }

        setActionSubmitting(true);
        try {
            const res = await fetch(`/api/claims/${claim.id}/transfer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, transferTarget: targetPayload })
            });

            if (res.ok) {
                toast.success(action === "TERMINATE" ? "Policy terminated successfully" : "Policy transferred successfully");
                // Refresh claim
                const refreshed = await fetch(`/api/claims/${claim.id}`);
                const data = await refreshed.json();
                setClaim(data.claim);
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to process policy action");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred processing the policy action");
        } finally {
            setActionSubmitting(false);
        }
    };

    const collectTransferTargets = () => {
        const targets: Array<{ id: string; type: string; name: string; relation: string }> = [];
        if (claim?.policy?.dependents) {
            Object.entries(claim.policy.dependents).forEach(([id, dep]: [string, any]) => {
                targets.push({ id, type: "DEPENDENT", name: dep.firstName + " " + dep.lastName, relation: dep.relationship || "Dependent" });
            });
        }
        if (claim?.policy?.beneficiaries) {
            Object.entries(claim.policy.beneficiaries).forEach(([id, ben]: [string, any]) => {
                targets.push({ id, type: "BENEFICIARY", name: ben.name, relation: ben.relationship || "Beneficiary" });
            });
        }
        // Exclude the deceased if they are in the list
        return targets.filter(t => t.id !== claim.dependentId);
    };

    const transferTargets = collectTransferTargets();

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10 print:max-w-none print:m-0 print:p-0">
            {/* Header */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Link href="/claims">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Claim Details</h1>
                        <p className="text-gray-500">{claim.claimNumber}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                    <ShareDocumentButton 
                        title={`Claim ${claim.claimNumber}`} 
                        text={`Hello,\n\nHere is a link to the Royalty Funeral Services Claim Document ${claim.claimNumber}.`}
                    />
                    <Badge className={STATUS_COLORS[claim.status] || "bg-gray-100 text-gray-800"}>
                        {claim.status.replace("_", " ")}
                    </Badge>
                </div>
            </div>

            {/* Print Only Header */}
            <div className="hidden print:block mb-8 text-center border-b pb-4">
                <h1 className="text-3xl font-bold uppercase tracking-wider text-gray-900">Royalty Funeral Services</h1>
                <h2 className="text-xl font-semibold mt-2 text-gray-800">Claim Receipt / Details</h2>
                <div className="text-sm text-gray-600 mt-1">Claim Number: {claim.claimNumber}</div>
            </div>

            <div className="space-y-6 print:space-y-6">
                <div className="space-y-6 print:space-y-6">
                    {/* Deceased & Burial Info */}
                    <Card className="print:break-inside-avoid shadow-sm">
                        <CardHeader className="bg-slate-50/80 border-b pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                                <User className="h-5 w-5 text-purple-600" />
                                Deceased & Burial Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Name</p>
                                    <p className="text-base font-semibold text-gray-900">{claim.deceasedName}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Type</p>
                                    <p className="text-base font-semibold text-gray-900">
                                        {claim.deceasedType === "PRINCIPAL" ? "Principal Member" : "Dependent"}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Date of Death</p>
                                    <p className="text-base font-medium text-gray-900">{formatDate(claim.dateOfDeath)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                                    <p className="text-base font-medium text-gray-900">{formatDate(claim.deceasedDOB) || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Cause of Death</p>
                                    <p className="text-base font-medium text-gray-900">{claim.causeOfDeath || "N/A"}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 border-t pt-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Place of Death</p>
                                    <p className="text-base text-gray-900">{claim.placeOfDeath || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Burial Place</p>
                                    <p className="text-base text-gray-900">{claim.burialPlace || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Approx. Distance</p>
                                    <p className="text-base text-gray-900">{claim.approximateDistance || "N/A"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Claim Details */}
                    <Card className="print:break-inside-avoid shadow-sm">
                        <CardHeader className="bg-slate-50/80 border-b pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                                <FileCheck className="h-5 w-5 text-blue-600" />
                                Claim & Policy Details
                            </CardTitle>
                        </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Claim Amount</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {formatCurrency(claim.claimAmount)}
                                </p>
                            </div>
                            {claim.approvedAmount && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Approved Amount</p>
                                    <p className="text-xl font-bold text-green-600">
                                        {formatCurrency(claim.approvedAmount)}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                             <div>
                                <p className="text-sm font-medium text-gray-500">Policy Number</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge className={PLAN_COLORS[claim.policy?.planType] || "bg-gray-100"}>
                                        {claim.policy?.planType || "Unknown Plan"}
                                    </Badge>
                                    <span className="text-sm font-medium text-gray-900">
                                        {claim.policy?.policyNumber || "N/A"}
                                    </span>
                                </div>
                            </div>
                            <div>
                                 <p className="text-sm font-medium text-gray-500">Employee No.</p>
                                 <p className="text-base text-gray-900">{claim.employeeNumber || "N/A"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Declarant Details */}
                <Card className="print:break-before-page print:mt-10 print:break-inside-avoid shadow-sm">
                    <CardHeader className="bg-slate-50/80 border-b pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                            <User className="h-5 w-5 text-amber-600" />
                            Declarant Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Name</p>
                                <p className="text-base text-gray-900">{claim.declaration?.declarantName || claim.declarantName || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">ID Number</p>
                                <p className="text-base text-gray-900">{claim.declaration?.declarantIdNumber || claim.declarantIdNumber || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Relationship</p>
                                <p className="text-base text-gray-900">{claim.declaration?.declarantRelation || claim.declarantRelation || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Phone</p>
                                <p className="text-base text-gray-900">{claim.declaration?.declarantPhone || claim.client?.phone || "N/A"}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm font-medium text-gray-500">Address</p>
                                <p className="text-base text-gray-900">{claim.declarantAddress || "N/A"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Timeline */}
            <Card className="print:hidden shadow-sm h-fit">
                <CardHeader className="bg-slate-50/80 border-b pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                        <Clock className="h-5 w-5 text-emerald-600" />
                        Timeline & Status
                    </CardTitle>
                </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-purple-600 text-slate-500 group-[.is-active]:text-purple-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                    <FileCheck className="w-4 h-4" />
                                </div>
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-slate-200 shadow">
                                    <div className="flex items-center justify-between space-x-2 mb-1">
                                        <div className="font-bold text-slate-900">Created</div>
                                        <time className="font-caveat font-medium text-indigo-500 text-xs">{claim.createdAt ? new Date(claim.createdAt).toLocaleString() : "N/A"}</time>
                                    </div>
                                    <div className="text-slate-500 text-sm">Claim submitted by {claim.declarantName || "Client"}</div>
                                </div>
                            </div>
                            {claim.reviewStartedAt && (
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-blue-600 text-slate-500 group-[.is-active]:text-blue-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                        <FileCheck className="w-4 h-4" />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-slate-200 shadow">
                                        <div className="flex items-center justify-between space-x-2 mb-1">
                                            <div className="font-bold text-slate-900">Under Review</div>
                                            <time className="font-caveat font-medium text-indigo-500 text-xs">{new Date(claim.reviewStartedAt).toLocaleString()}</time>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {claim.approvedAt && (
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-green-600 text-slate-500 group-[.is-active]:text-green-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                        <FileCheck className="w-4 h-4" />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-slate-200 shadow">
                                        <div className="flex items-center justify-between space-x-2 mb-1">
                                            <div className="font-bold text-slate-900">Approved</div>
                                            <time className="font-caveat font-medium text-indigo-500 text-xs">{new Date(claim.approvedAt).toLocaleString()}</time>
                                        </div>
                                        <div className="text-slate-500 text-sm">Approved by {claim.approvedBy?.firstName} {claim.approvedBy?.lastName}</div>
                                    </div>
                                </div>
                            )}
                            {claim.rejectedAt && (
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-red-600 text-slate-500 group-[.is-active]:text-red-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                        <FileCheck className="w-4 h-4" />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-slate-200 shadow">
                                        <div className="flex items-center justify-between space-x-2 mb-1">
                                            <div className="font-bold text-slate-900">Rejected</div>
                                            <time className="font-caveat font-medium text-indigo-500 text-xs">{new Date(claim.rejectedAt).toLocaleString()}</time>
                                        </div>
                                        {claim.rejectionReason && <div className="text-slate-500 text-sm">Reason: {claim.rejectionReason}</div>}
                                    </div>
                                </div>
                            )}
                            {claim.paidAt && (
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-emerald-600 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                        <FileCheck className="w-4 h-4" />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-slate-200 shadow">
                                        <div className="flex items-center justify-between space-x-2 mb-1">
                                            <div className="font-bold text-slate-900">Paid</div>
                                            <time className="font-caveat font-medium text-indigo-500 text-xs">{new Date(claim.paidAt).toLocaleString()}</time>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {claim.status === "PENDING" && (
                    <Card className="md:col-span-2 border-blue-200 bg-blue-50/50">
                        <CardContent className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <FileSignature className="h-5 w-5 text-blue-600" />
                                    Declaration Required
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    This claim is in draft status. You must submit the declaration to process it further.
                                </p>
                            </div>
                            <Link href={`/claims/new?claimId=${claim.id}&step=declaration`}>
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    Proceed to Declaration
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {claim.status === "PAID" && !claim.policyActionTaken && (
                    <Card className="md:col-span-2 border-purple-200 bg-purple-50/30 print:hidden mt-6">
                        <CardHeader className="bg-purple-100/50 border-b border-purple-100 pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg text-purple-900">
                                <ArrowRightLeft className="h-5 w-5 text-purple-600" />
                                Post-Claim Policy Action Required
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <p className="text-sm text-gray-700 mb-4">
                                This claim has been fully paid. Since the deceased was the principal member, you need to either terminate the policy or transfer it to a surviving dependent or beneficiary to assume principal membership.
                            </p>
                            
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="flex-1 space-y-4 p-4 border rounded-lg bg-white border-red-100">
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert className="h-5 w-5 text-red-500" />
                                        <h4 className="font-semibold text-gray-900">Terminate Policy</h4>
                                    </div>
                                    <p className="text-xs text-gray-500 min-h-[40px]">
                                        End the policy completely. All remaining dependents will lose their coverage.
                                    </p>
                                    <Button 
                                        variant="destructive" 
                                        onClick={() => {
                                            if (window.confirm("Are you sure you want to terminate this policy permanently?")) {
                                                handlePolicyAction("TERMINATE");
                                            }
                                        }}
                                        disabled={actionSubmitting}
                                        className="w-full"
                                    >
                                        Terminate Policy
                                    </Button>
                                </div>
                                <div className="flex-1 space-y-4 p-4 border rounded-lg bg-white border-purple-100">
                                    <div className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-purple-500" />
                                        <h4 className="font-semibold text-gray-900">Transfer Policy</h4>
                                    </div>
                                    <p className="text-xs text-gray-500 min-h-[40px]">
                                        Keep the policy active by transferring the principal membership to a surviving dependent or beneficiary.
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        <Select value={selectedTarget} onValueChange={setSelectedTarget} disabled={actionSubmitting}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select new Principal Member" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {transferTargets.length === 0 ? (
                                                    <SelectItem value="none" disabled>No remaining dependents/beneficiaries</SelectItem>
                                                ) : (
                                                    transferTargets.map(t => (
                                                        <SelectItem key={`${t.type}:${t.id}`} value={`${t.type}:${t.id}`}>
                                                            {t.name} ({t.relation})
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <Button 
                                            onClick={() => {
                                                if (window.confirm("Are you sure you want to transfer this policy?")) {
                                                    handlePolicyAction("TRANSFER");
                                                }
                                            }}
                                            disabled={actionSubmitting || !selectedTarget || transferTargets.length === 0}
                                            className="w-full bg-purple-600 hover:bg-purple-700"
                                        >
                                            Transfer Policy
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {claim.policyActionTaken && (
                    <Card className="md:col-span-2 border-green-200 bg-green-50/50 print:hidden mt-6">
                        <CardContent className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    Post-Claim Action Completed
                                </h3>
                                <p className="text-sm text-green-800 mt-1">
                                    This policy was successfully <strong>{claim.policyActionTaken.toLowerCase()}</strong> on {new Date(claim.policyActionDate).toLocaleDateString()}.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
            
            {/* Print Footer */}
            <div className="hidden print:block mt-12 pt-8 border-t border-gray-300">
                <div className="grid grid-cols-2 gap-8 text-sm">
                    <div>
                        <div className="font-semibold mb-6">Submitted By:</div>
                        <div className="border-b border-gray-400 w-48 mb-2"></div>
                        <div className="text-gray-600">{claim.declarantName}</div>
                        <div className="text-gray-500 text-xs mt-1">Date: __________________</div>
                    </div>
                    <div>
                        <div className="font-semibold mb-6">Processed By (Admin):</div>
                        <div className="border-b border-gray-400 w-48 mb-2"></div>
                        <div className="text-gray-600">{claim.approvedBy?.firstName} {claim.approvedBy?.lastName}</div>
                        <div className="text-gray-500 text-xs mt-1">Date: __________________</div>
                    </div>
                </div>
                <div className="text-center text-xs text-gray-400 mt-12">
                    Generated by Royalty Funeral Services admin system on {new Date().toLocaleDateString()}.
                </div>
            </div>
        </div>
    );
}
