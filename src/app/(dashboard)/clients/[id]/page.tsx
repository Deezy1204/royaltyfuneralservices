"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatCurrency, PLAN_COLORS, STATUS_COLORS } from "@/lib/utils";
import { differenceInDays } from "date-fns";
import {
    ArrowLeft, Edit, FileText, CreditCard, User, Phone, Mail,
    MapPin, Briefcase, Building2, CreditCard as BankIcon, FileCheck, Clock, Shield, Printer
} from "lucide-react";

interface Client {
    id: string;
    clientNumber: string;
    title: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    idNumber: string;
    dateOfBirth: string;
    gender: string;
    maritalStatus: string;
    phone: string;
    altPhone?: string;
    email?: string;
    streetAddress: string;
    suburb?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    occupation?: string;
    employer?: string;
    employerAddress?: string;
    bankName?: string;
    accountNumber?: string;
    branchCode?: string;
    accountType?: string;
    isActive: boolean;
    createdAt: string;
    policies: any[];
    claims: any[];
    payments: any[];
}

export default function ClientDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchClient = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/clients/${id}`);
            if (res.ok) {
                const data = await res.json();
                setClient(data.client);
            } else {
                setError("Client not found");
            }
        } catch {
            setError("Failed to load client");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchClient(); }, [fetchClient]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            </div>
        );
    }

    if (error || !client) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <User className="h-16 w-16 text-gray-300" />
                <h2 className="mt-4 text-xl font-semibold text-gray-900">Client Not Found</h2>
                <p className="mt-2 text-gray-500">{error}</p>
                <Link href="/clients" className="mt-4">
                    <Button>Back to Clients</Button>
                </Link>
            </div>
        );
    }

    // Calculate Waiting Period & Full Member Status
    let isFullMember = false;
    let waitingPeriodBadge = null;

    if (client.policies && client.policies.length > 0) {
        // Assume first active policy or earliest policy inception is the start date
        const firstPolicy = [...client.policies].sort((a, b) =>
            new Date(a.inceptionDate || a.createdAt).getTime() - new Date(b.inceptionDate || b.createdAt).getTime()
        )[0];

        const start = new Date(firstPolicy.inceptionDate || firstPolicy.createdAt);
        const daysPassed = differenceInDays(new Date(), start);
        const daysLeft = 90 - daysPassed;

        if (daysLeft > 0) {
            waitingPeriodBadge = (
                <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200 ml-2">
                    <Clock className="mr-1 w-3 h-3" /> Waiting Period ({daysLeft} days left)
                </Badge>
            );
        } else {
            isFullMember = true;
            waitingPeriodBadge = (
                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 ml-2">
                    <Shield className="mr-1 w-3 h-3" /> Full Member
                </Badge>
            );
        }
    } else {
        waitingPeriodBadge = (
            <Badge variant="outline" className="text-gray-500 bg-gray-50 border-gray-200 ml-2">
                No Policies
            </Badge>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10 print:max-w-none print:m-0 print:p-0">
            {/* Header */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Link href="/clients">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                            {client.title} {client.firstName} {client.middleName} {client.lastName}
                            {waitingPeriodBadge}
                        </h1>
                        <p className="text-gray-500">{client.clientNumber}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                    <Badge variant={client.isActive ? "success" : "secondary"}>
                        {client.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Link href={`/clients/${id}/policy`}>
                        <Button variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">
                            <FileText className="mr-2 h-4 w-4" /> Generate Policy
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Print Only Header */}
            <div className="hidden print:block mb-8 text-center border-b pb-4">
                <h1 className="text-3xl font-bold uppercase tracking-wider text-gray-900">Royalty Funeral Services</h1>
                <h2 className="text-xl font-semibold mt-2 text-gray-800">Client Profile</h2>
                <div className="text-sm text-gray-600 mt-2">
                    Client: {client.title} {client.firstName} {client.lastName}
                </div>
                <div className="text-sm text-gray-600 mt-1">Client Number: {client.clientNumber}</div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-2 print:gap-4">
                {/* Personal Info */}
                <Card className="print:break-inside-avoid shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="h-4 w-4 text-purple-600" />Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {[
                            { label: "ID Number", value: client.idNumber },
                            { label: "Date of Birth", value: formatDate(client.dateOfBirth) },
                            { label: "Gender", value: client.gender },
                            { label: "Marital Status", value: client.maritalStatus },
                            { label: "Member Since", value: formatDate(client.createdAt) },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between">
                                <span className="text-gray-500">{label}</span>
                                <span className="font-medium text-gray-900">{value || "—"}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Contact Info */}
                <Card className="print:break-inside-avoid shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Phone className="h-4 w-4 text-blue-600" />Contact Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center gap-2"><Phone className="h-3 w-3 text-gray-400" /><span>{client.phone}</span></div>
                        {client.altPhone && <div className="flex items-center gap-2"><Phone className="h-3 w-3 text-gray-400" /><span>{client.altPhone} (Alt)</span></div>}
                        {client.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3 text-gray-400" /><span>{client.email}</span></div>}
                        <div className="flex items-start gap-2 mt-2">
                            <MapPin className="h-3 w-3 text-gray-400 mt-0.5" />
                            <span className="text-gray-700">
                                {client.streetAddress}{client.suburb ? `, ${client.suburb}` : ""}<br />
                                {client.city}, {client.province} {client.postalCode}<br />
                                {client.country}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Employment */}
                {(client.occupation || client.employer) && (
                    <Card className="print:break-inside-avoid shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Briefcase className="h-4 w-4 text-green-600" />Employment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {[
                                { label: "Occupation", value: client.occupation },
                                { label: "Employer", value: client.employer },
                                { label: "Employer Address", value: client.employerAddress },
                            ].map(({ label, value }) => value ? (
                                <div key={label} className="flex justify-between">
                                    <span className="text-gray-500">{label}</span>
                                    <span className="font-medium text-gray-900">{value}</span>
                                </div>
                            ) : null)}
                        </CardContent>
                    </Card>
                )}

                {/* Banking */}
                {client.bankName && (
                    <Card className="print:break-inside-avoid shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BankIcon className="h-4 w-4 text-orange-600" />Banking Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {[
                                { label: "Bank", value: client.bankName },
                                { label: "Account Number", value: client.accountNumber },
                                { label: "Branch Code", value: client.branchCode },
                                { label: "Account Type", value: client.accountType },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex justify-between">
                                    <span className="text-gray-500">{label}</span>
                                    <span className="font-medium text-gray-900">{value || "—"}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Policies */}
            <div className="space-y-4 print:break-before-page">
                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 border-b pb-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    Policies ({client.policies.length})
                </h2>

                {client.policies.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-10">
                            <FileText className="h-10 w-10 text-gray-300 mb-2" />
                            <p className="text-gray-500 font-medium">No policies found for this client.</p>
                            <Link href={`/proposals/new?clientId=${id}`}>
                                <Button variant="outline" className="mt-4">Create Proposal</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    client.policies.map((policy) => (
                        <Card key={policy.id} className="border-purple-100 shadow-sm overflow-hidden">
                            <div className="bg-purple-50/50 border-b border-purple-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        Policy: {policy.policyNumber}
                                        <Badge className={STATUS_COLORS[policy.status]}>{policy.status}</Badge>
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">Started: {formatDate(policy.startDate || policy.createdAt)}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Plan Type</p>
                                        <div className="flex gap-1">
                                            <Badge className={PLAN_COLORS[policy.planType]}>{policy.planType}</Badge>
                                            <Badge variant="outline">{policy.planServiceType || "SERVICE"}</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <CardContent className="p-0">
                                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b print:block print:border-b-0 print:divide-none">
                                    {/* Financials & Premium */}
                                    <div className="p-4 space-y-3">
                                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest border-b pb-1">Premium Breakdown</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            {(() => {
                                                const totalMonthly = Number(policy.premiumAmount) || 0;
                                                const dependentsTotal = Object.values(policy.dependents || {}).reduce((acc: number, dep: any) => acc + (Number(dep.premium) || 0), 0);
                                                const basePremium = totalMonthly - dependentsTotal;
                                                return (
                                                    <>
                                                        <span className="text-gray-500">Base Premium:</span>
                                                        <span className="font-medium">{formatCurrency(basePremium)}</span>

                                                        <span className="text-gray-500">Dependents Premium:</span>
                                                        <span className="font-medium">{formatCurrency(dependentsTotal)}</span>

                                                        <span className="text-gray-500 font-bold border-t pt-1 mt-1">Total Monthly Premium:</span>
                                                        <span className="font-bold text-purple-700 border-t pt-1 mt-1">{formatCurrency(totalMonthly)}</span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {/* Dependents */}
                                    <div className="p-4 space-y-3 print:break-before-page">
                                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest border-b pb-1">Dependents</h4>
                                        {!policy.dependents || Object.keys(policy.dependents).length === 0 ? (
                                            <p className="text-sm text-gray-500 italic">No dependents listed.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {Object.entries(policy.dependents).map(([depId, dep]: [string, any]) => (
                                                    <div key={depId} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                                                        <div>
                                                            <p className="font-medium">{dep.firstName} {dep.lastName}</p>
                                                            <p className="text-xs text-gray-500">{dep.relationship} • ID: {dep.idNumber || "—"}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-medium text-purple-600">{formatCurrency(Number(dep.premium) || 0)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x print:block print:divide-none">
                                    {/* Beneficiaries */}
                                    <div className="p-4 space-y-3">
                                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest border-b pb-1">Beneficiaries</h4>
                                        {!policy.beneficiaries || Object.keys(policy.beneficiaries).length === 0 ? (
                                            <p className="text-sm text-gray-500 italic">No beneficiaries listed.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {Object.entries(policy.beneficiaries || {}).map(([benId, ben]: [string, any]) => (
                                                    <div key={benId} className="flex justify-between items-center text-sm bg-gray-50/50 p-2 rounded border border-gray-100">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{ben.firstName} {ben.lastName} <span className="text-xs text-gray-500 font-normal">({ben.relationship})</span></p>
                                                            <p className="text-xs text-gray-500">{ben.phone || ben.idNumber || "No contact info"}</p>
                                                        </div>
                                                        <Badge variant="outline" className="text-[10px] uppercase tracking-tighter bg-white">Beneficiary</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Application Details */}
                                    <div className="p-4 space-y-3 bg-gray-50/50">
                                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest border-b pb-1">Application Details</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <span className="text-gray-500">Proposal No:</span>
                                            <span className="font-medium">{policy.proposalNumber || "—"}</span>

                                            <span className="text-gray-500">Waiting Period End:</span>
                                            <span className="font-medium">{formatDate(policy.waitingPeriodEnd)}</span>

                                            {policy.notes && (
                                                <div className="col-span-2 mt-2">
                                                    <span className="text-gray-500 block mb-1">Notes:</span>
                                                    <p className="p-2 bg-white rounded border text-gray-700 italic">{policy.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Recent Claims */}
            {client.claims.length > 0 && (
                <Card className="print:break-inside-avoid shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileCheck className="h-4 w-4 text-red-500" />Claims ({client.claims.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Claim #</TableHead>
                                    <TableHead>Deceased</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {client.claims.map((claim) => (
                                    <TableRow key={claim.id}>
                                        <TableCell className="font-medium text-purple-600">{claim.claimNumber}</TableCell>
                                        <TableCell>{claim.deceasedName}</TableCell>
                                        <TableCell>{formatCurrency(claim.claimAmount || 0)}</TableCell>
                                        <TableCell><Badge className={STATUS_COLORS[claim.status]}>{claim.status}</Badge></TableCell>
                                        <TableCell className="text-gray-500">{formatDate(claim.createdAt)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Recent Payments */}
            {client.payments.length > 0 && (
                <Card className="print:break-inside-avoid shadow-sm mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CreditCard className="h-4 w-4 text-green-600" />Payments ({client.payments.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Receipt #</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Months Covered</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {client.payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell className="font-medium text-purple-600">{payment.receiptNumber || payment.paymentNumber}</TableCell>
                                        <TableCell className="text-green-600 font-semibold">{formatCurrency(payment.amount || 0)}</TableCell>
                                        <TableCell>{payment.paymentMethod}</TableCell>
                                        <TableCell>{payment.monthsCovered || "—"}</TableCell>
                                        <TableCell className="text-gray-500">{formatDate(payment.paymentDate)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
