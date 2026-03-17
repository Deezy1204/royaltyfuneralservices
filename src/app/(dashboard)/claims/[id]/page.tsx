"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, FileCheck, FileSignature, Calendar, MapPin, Stethoscope, Briefcase, FileText } from "lucide-react";
import { formatDate, formatCurrency, STATUS_COLORS, PLAN_COLORS } from "@/lib/utils";

export default function ClaimDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [claim, setClaim] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Claim #{claim.claimNumber}
                        </h1>
                        <p className="text-gray-500">
                            Submitted on {formatDate(claim.createdAt)}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge className={STATUS_COLORS[claim.status] || "bg-gray-100 text-gray-800"}>
                        {claim.status.replace("_", " ")}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-purple-600" />
                            Deceased Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Name</p>
                            <p className="text-base text-gray-900">{claim.deceasedName}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Type</p>
                                <p className="text-base text-gray-900">
                                    {claim.deceasedType === "PRINCIPAL" ? "Principal Member" : "Dependent"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Date of Death</p>
                                <p className="text-base text-gray-900">{formatDate(claim.dateOfDeath)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                                <p className="text-base text-gray-900">{formatDate(claim.deceasedDOB) || "N/A"}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Cause of Death</p>
                            <p className="text-base text-gray-900">{claim.causeOfDeath || "N/A"}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileCheck className="h-5 w-5 text-purple-600" />
                            Claim Details
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

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-600" />
                            Declarant Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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

                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-rose-600" />
                            Burial Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
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

                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-amber-600" />
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
                                    <div className="text-slate-500 text-sm">Claim submitted by {claim.createdBy?.firstName} {claim.createdBy?.lastName}</div>
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
            </div>
        </div>
    );
}
