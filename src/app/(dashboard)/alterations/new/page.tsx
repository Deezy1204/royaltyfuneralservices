"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Send, RefreshCw, User, Shield, Search, AlertCircle } from "lucide-react";

interface Client {
    id: string;
    firstName: string;
    lastName: string;
    idNumber: string;
    phone?: string;
    policies: { id: string; policyNumber: string; planType: string; }[];
}

const ALTERATION_TYPES = [
    { value: "UPGRADE", label: "Upgrade Plan" },
    { value: "DOWNGRADE", label: "Downgrade Plan" },
    { value: "ADD_DEPENDENT", label: "Add Dependent" },
    { value: "REMOVE_DEPENDENT", label: "Remove Dependent" },
    { value: "ADD_RIDER", label: "Add Rider" },
    { value: "REMOVE_RIDER", label: "Remove Rider" },
    { value: "CHANGE_PAYMENT", label: "Change Payment Details" },
    { value: "CHANGE_DETAILS", label: "Change Policy Details" },
];

const PLAN_OPTIONS = ["WHITE", "GOLD", "BLUE", "PURPLE"];

export default function NewAlterationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const clientIdParam = searchParams.get("clientId");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Client search
    const [clientSearch, setClientSearch] = useState("");
    const [clientResults, setClientResults] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        policyId: "",
        alterationType: "",
        notes: "",
        newPlan: "",
        dependentName: "",
        dependentDOB: "",
        dependentId: "",
        riderType: "",
        newPaymentMethod: "",
        newBankName: "",
        newAccountNumber: "",
        newBranchCode: "",
        newDebitDay: "",
        changeField: "",
        changeValue: "",
    });

    // Load passed client from URL
    useEffect(() => {
        if (clientIdParam) {
            fetch(`/api/clients/${clientIdParam}`)
                .then(r => r.json())
                .then(d => {
                    if (d.client) {
                        setSelectedClient(d.client);
                        setClientSearch(`${d.client.firstName} ${d.client.lastName}`);
                        if (d.client.policies?.[0]) {
                            setFormData(p => ({ ...p, policyId: d.client.policies[0].id }));
                        }
                    }
                }).catch(() => { });
        }
    }, [clientIdParam]);

    // Click outside to close
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const searchClients = useCallback(async (q: string) => {
        if (q.length < 2) { setClientResults([]); return; }
        try {
            const res = await fetch(`/api/clients?search=${encodeURIComponent(q)}&limit=8`);
            if (res.ok) {
                const data = await res.json();
                setClientResults(data.clients || []);
                setShowDropdown(true);
            }
        } catch { setClientResults([]); }
    }, []);

    useEffect(() => {
        if (selectedClient) return;
        const t = setTimeout(() => searchClients(clientSearch), 300);
        return () => clearTimeout(t);
    }, [clientSearch, selectedClient, searchClients]);

    const selectClient = (client: Client) => {
        setSelectedClient(client);
        setClientSearch(`${client.firstName} ${client.lastName}`);
        setShowDropdown(false);
        const firstPolicy = client.policies?.[0];
        setFormData(p => ({ ...p, policyId: firstPolicy?.id || "" }));
    };

    const clearClient = () => {
        setSelectedClient(null);
        setClientSearch("");
        setFormData(p => ({ ...p, policyId: "", alterationType: "" }));
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) { setError("Please select a client"); return; }
        if (!formData.policyId) { setError("Please select a policy"); return; }
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/alterations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, clientId: selectedClient.id }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create alteration");
            }

            router.push("/alterations");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Link href="/alterations">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">New Policy Alteration</h1>
                    <p className="text-gray-500">Request changes to an existing policy</p>
                </div>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />{error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Client Search */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-purple-600" />
                            Step 1: Select Client
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1" ref={searchRef}>
                            <label className="text-sm font-medium">Search Client</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    className="w-full h-10 rounded-md border border-gray-200 pl-9 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    placeholder="Type name or ID number..."
                                    value={clientSearch}
                                    onChange={e => { setClientSearch(e.target.value); if (selectedClient) clearClient(); }}
                                />
                                {showDropdown && clientResults.length > 0 && (
                                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                                        {clientResults.map(c => (
                                            <div
                                                key={c.id}
                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 cursor-pointer"
                                                onClick={() => selectClient(c)}
                                            >
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                                                    {c.firstName[0]}{c.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{c.firstName} {c.lastName}</p>
                                                    <p className="text-xs text-gray-500">ID: {c.idNumber} · {c.policies?.length || 0} policy(ies)</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedClient && (
                            <div className="grid grid-cols-2 gap-4 rounded-lg bg-purple-50 p-4">
                                <div>
                                    <p className="text-xs text-gray-500">Client Name</p>
                                    <p className="font-semibold">{selectedClient.firstName} {selectedClient.lastName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">ID Number</p>
                                    <p className="font-semibold">{selectedClient.idNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <p className="font-semibold">{selectedClient.phone || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Policies</p>
                                    <p className="font-semibold">{selectedClient.policies?.length || 0}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Step 2: Policy Selection */}
                {selectedClient && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-purple-600" />
                                Step 2: Select Policy & Alteration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {selectedClient.policies?.length > 0 ? (
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Policy</label>
                                    <Select value={formData.policyId} onValueChange={(v) => handleChange("policyId", v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select policy..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedClient.policies.map(pol => (
                                                <SelectItem key={pol.id} value={pol.id}>
                                                    {pol.policyNumber} – {pol.planType} Plan
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">This client has no active policies.</p>
                            )}

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Type of Alteration</label>
                                <Select value={formData.alterationType} onValueChange={(v) => handleChange("alterationType", v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select change type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ALTERATION_TYPES.map(type => (
                                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Change Details */}
                {formData.alterationType && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <RefreshCw className="h-5 w-5 text-purple-600" />
                                Step 3: Change Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {(formData.alterationType === "UPGRADE" || formData.alterationType === "DOWNGRADE") && (
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">New Plan</label>
                                    <Select value={formData.newPlan} onValueChange={(v) => handleChange("newPlan", v)}>
                                        <SelectTrigger><SelectValue placeholder="Select new plan" /></SelectTrigger>
                                        <SelectContent>
                                            {PLAN_OPTIONS.map(p => <SelectItem key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()} Plan</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {formData.alterationType === "ADD_DEPENDENT" && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Input label="Dependent Full Name" value={formData.dependentName} onChange={e => handleChange("dependentName", e.target.value)} />
                                    <Input label="Dependent ID Number" value={formData.dependentId} onChange={e => handleChange("dependentId", e.target.value)} />
                                    <Input label="Date of Birth" type="date" value={formData.dependentDOB} onChange={e => handleChange("dependentDOB", e.target.value)} />
                                </div>
                            )}

                            {formData.alterationType === "REMOVE_DEPENDENT" && (
                                <Input label="Dependent Name / ID to Remove" value={formData.dependentName} onChange={e => handleChange("dependentName", e.target.value)} />
                            )}

                            {(formData.alterationType === "ADD_RIDER" || formData.alterationType === "REMOVE_RIDER") && (
                                <Input label="Rider Type" value={formData.riderType} onChange={e => handleChange("riderType", e.target.value)} placeholder="e.g. Accidental Death, Disability Cover..." />
                            )}

                            {formData.alterationType === "CHANGE_PAYMENT" && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">New Payment Method</label>
                                        <Select value={formData.newPaymentMethod} onValueChange={v => handleChange("newPaymentMethod", v)}>
                                            <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DEBIT_ORDER">Debit Order</SelectItem>
                                                <SelectItem value="EFT">EFT</SelectItem>
                                                <SelectItem value="CASH">Cash</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Input label="Bank Name" value={formData.newBankName} onChange={e => handleChange("newBankName", e.target.value)} />
                                    <Input label="Account Number" value={formData.newAccountNumber} onChange={e => handleChange("newAccountNumber", e.target.value)} />
                                    <Input label="Branch Code" value={formData.newBranchCode} onChange={e => handleChange("newBranchCode", e.target.value)} />
                                    <Input label="New Debit Order Day" type="number" min="1" max="31" value={formData.newDebitDay} onChange={e => handleChange("newDebitDay", e.target.value)} />
                                </div>
                            )}

                            {formData.alterationType === "CHANGE_DETAILS" && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Input label="Field to Change" value={formData.changeField} onChange={e => handleChange("changeField", e.target.value)} placeholder="e.g. Phone, Address..." />
                                    <Input label="New Value" value={formData.changeValue} onChange={e => handleChange("changeValue", e.target.value)} />
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Notes / Reason for Change</label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={e => handleChange("notes", e.target.value)}
                                    placeholder="Provide details about this alteration request..."
                                    rows={4}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-end gap-2">
                    <Link href="/alterations">
                        <Button variant="outline" type="button">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={loading || !selectedClient || !formData.policyId || !formData.alterationType}>
                        {loading ? "Submitting..." : "Submit Alteration"} <Send className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </form>
        </div>
    );
}
