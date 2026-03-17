"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Search, AlertCircle, CheckCircle, User, DollarSign, Coins } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import ReactSelect from "react-select";

// Convert number to words
function numberToWords(amount: number, currency: string = "ZAR"): string {
    if (!amount || isNaN(amount)) return "";
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    function convert(n: number): string {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
        if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
        if (n < 1000000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
        return convert(Math.floor(n / 1000000)) + " Million" + (n % 1000000 ? " " + convert(n % 1000000) : "");
    }

    const whole = Math.floor(amount);
    const decimal = Math.round((amount - whole) * 100);

    const wholeUnit = currency === "USD" ? (whole === 1 ? "Dollar" : "Dollars") : (whole === 1 ? "Rand" : "Rand");
    const decimalUnit = currency === "USD" ? (decimal === 1 ? "Cent" : "Cents") : (decimal === 1 ? "Cent" : "Cents");

    let result = convert(whole) + " " + wholeUnit;
    if (decimal > 0) result += " and " + convert(decimal) + " " + decimalUnit;
    return result + " Only";
}

const MONTH_OPTIONS = [
    { value: "January", label: "January" },
    { value: "February", label: "February" },
    { value: "March", label: "March" },
    { value: "April", label: "April" },
    { value: "May", label: "May" },
    { value: "June", label: "June" },
    { value: "July", label: "July" },
    { value: "August", label: "August" },
    { value: "September", label: "September" },
    { value: "October", label: "October" },
    { value: "November", label: "November" },
    { value: "December", label: "December" },
].map(m => ({ ...m, value: `${m.value} ${new Date().getFullYear()}` }));

interface Client {
    id: string;
    firstName: string;
    lastName: string;
    idNumber: string;
    dateOfBirth: string;
    phone: string;
    policies: any[];
}

export default function NewPaymentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const clientIdParam = searchParams.get("clientId");

    const [clientSearch, setClientSearch] = useState("");
    const [clientResults, setClientResults] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const searchRef = useRef<HTMLDivElement>(null);

    const [form, setForm] = useState({
        policyId: "",
        paymentDate: new Date().toISOString().split("T")[0],
        currency: "ZAR",
        monthsCovered: [] as string[],
        receivedBy: "",
        notes: "",
    });

    const amountInWords = numberToWords(parseFloat(form.amount) || 0, form.currency);

    // Load client from URL param
    useEffect(() => {
        if (clientIdParam) {
            fetch(`/api/clients/${clientIdParam}`)
                .then(r => r.json())
                .then(d => {
                    if (d.client) {
                        setSelectedClient(d.client);
                        setClientSearch(`${d.client.firstName} ${d.client.lastName}`);
                    }
                }).catch(() => { });
        }
    }, [clientIdParam]);

    // Click outside to close dropdown
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
        } catch {
            setClientResults([]);
        }
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
        setForm(p => ({ ...p, policyId: client.policies?.[0]?.id || "" }));
    };

    const clearClient = () => {
        setSelectedClient(null);
        setClientSearch("");
        setForm(p => ({ ...p, policyId: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) { setError("Please select a client"); return; }
        if (!form.amount || parseFloat(form.amount) <= 0) { setError("Please enter a valid amount"); return; }
        setSaving(true);
        setError("");
        try {
            const payload = {
                clientId: selectedClient.id,
                policyId: form.policyId || null,
                paymentDate: form.paymentDate,
                amount: parseFloat(form.amount),
                currency: form.currency,
                paymentMethod: form.paymentMethod,
                monthsCovered: form.monthsCovered.join(", "),
                receivedBy: form.receivedBy,
                notes: form.notes,
                amountInWords,
                status: "CONFIRMED",
            };
            const res = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => router.push("/payments"), 1500);
            } else {
                const d = await res.json();
                setError(d.error || "Failed to record payment");
            }
        } catch {
            setError("Failed to record payment");
        } finally {
            setSaving(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <h2 className="text-2xl font-bold text-gray-900">Payment Recorded!</h2>
                <p className="text-gray-500">Redirecting to payments list...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Link href="/payments">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Record Payment</h1>
                    <p className="text-gray-500">Royalty Funeral Services – Payment Receipt</p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />{error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Company Header */}
                <Card className="border-2 border-purple-200">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-1 border-b pb-4 mb-4">
                            <h2 className="text-xl font-bold text-purple-800">ROYALTY FUNERAL SERVICES</h2>
                            <p className="text-sm text-gray-600">Premium Funeral Cover Provider</p>
                            <p className="text-xs text-gray-500">Tel: 011 000 0000 | Email: info@royaltyfunerals.co.za</p>
                        </div>
                        <h3 className="text-center font-semibold text-gray-800 uppercase tracking-wide">PAYMENT RECEIPT</h3>
                    </CardContent>
                </Card>

                {/* Date */}
                <Card>
                    <CardContent className="pt-5">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Receipt Date"
                                type="date"
                                value={form.paymentDate}
                                onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))}
                                required
                            />
                            <Input
                                label="Received By (Staff Name)"
                                value={form.receivedBy}
                                onChange={e => setForm(p => ({ ...p, receivedBy: e.target.value }))}
                                placeholder="Staff member name"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Client / Life Assured */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="h-4 w-4 text-purple-600" />Life Assured Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Client Search */}
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
                                                    <p className="text-xs text-gray-500">ID: {c.idNumber}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Auto-filled client details */}
                        {selectedClient && (
                            <div className="grid grid-cols-2 gap-4 rounded-lg bg-purple-50 p-4">
                                <div>
                                    <p className="text-xs text-gray-500">Name of Life Assured</p>
                                    <p className="font-semibold text-gray-900">{selectedClient.firstName} {selectedClient.lastName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">ID Number</p>
                                    <p className="font-semibold text-gray-900">{selectedClient.idNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Date of Birth</p>
                                    <p className="font-semibold text-gray-900">{selectedClient.dateOfBirth ? new Date(selectedClient.dateOfBirth).toLocaleDateString("en-ZA") : "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <p className="font-semibold text-gray-900">{selectedClient.phone}</p>
                                </div>
                            </div>
                        )}

                        {/* Policy Selection */}
                        {selectedClient?.policies?.length > 0 && (
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Policy Number</label>
                                <Select value={form.policyId} onValueChange={v => setForm(p => ({ ...p, policyId: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Select policy" /></SelectTrigger>
                                    <SelectContent>
                                        {selectedClient.policies.map(pol => (
                                            <SelectItem key={pol.id} value={pol.id}>
                                                {pol.policyNumber} – {pol.planType} Plan
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Months Included (Select one or more)</label>
                            <ReactSelect
                                isMulti
                                options={MONTH_OPTIONS}
                                value={MONTH_OPTIONS.filter(o => form.monthsCovered.includes(o.value))}
                                onChange={(selected) => setForm(p => ({ ...p, monthsCovered: (selected as any).map((s: any) => s.value) }))}
                                className="text-sm"
                                placeholder="Select month(s)..."
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        minHeight: '40px',
                                        borderColor: '#e5e7eb',
                                        '&:hover': { borderColor: '#a855f7' }
                                    }),
                                    multiValue: (base) => ({
                                        ...base,
                                        backgroundColor: '#f3e8ff',
                                        borderRadius: '4px',
                                    }),
                                    multiValueLabel: (base) => ({
                                        ...base,
                                        color: '#7e22ce',
                                        fontWeight: '500',
                                    }),
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Details */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base">Payment Details</CardTitle>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setForm(p => ({ ...p, currency: "ZAR" }))}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${form.currency === "ZAR" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                <Coins className="h-3.5 w-3.5" /> ZAR
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm(p => ({ ...p, currency: "USD" }))}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${form.currency === "USD" ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                <DollarSign className="h-3.5 w-3.5" /> USD
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            label={`Premium Amount (${form.currency === 'USD' ? '$' : 'R'})`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.amount}
                            onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                            placeholder="0.00"
                            required
                        />
                        {form.amount && parseFloat(form.amount) > 0 && (
                            <div className="rounded-md bg-gray-50 border px-4 py-3">
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Amount In Words</p>
                                <p className="text-sm font-medium text-gray-800 italic">{amountInWords}</p>
                            </div>
                        )}

                        {/* Payment Method */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Payment Method</label>
                            <div className="flex gap-6">
                                {["CASH", "CHEQUE", "EFT", "OTHER"].map(method => (
                                    <label key={method} className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value={method}
                                            checked={form.paymentMethod === method}
                                            onChange={() => setForm(p => ({ ...p, paymentMethod: method }))}
                                            className="h-4 w-4 text-purple-600"
                                        />
                                        <span className="text-sm font-medium text-gray-700">{method.charAt(0) + method.slice(1).toLowerCase()}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <Input
                            label="Notes (optional)"
                            value={form.notes}
                            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                            placeholder="Any additional notes..."
                        />
                    </CardContent>
                </Card>

                {/* Summary */}
                {selectedClient && form.amount && (
                    <Card className="border-purple-200 bg-purple-50">
                        <CardContent className="pt-5">
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm"><span className="text-gray-600">Client:</span><span className="font-medium">{selectedClient.firstName} {selectedClient.lastName}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-600">Method:</span><span className="font-medium">{form.paymentMethod}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-600">Months:</span><span className="font-medium">{form.monthsCovered.length > 0 ? form.monthsCovered.join(", ") : "—"}</span></div>
                                <div className="flex justify-between font-bold text-purple-800 text-lg border-t mt-2 pt-2">
                                    <span>Total ({form.currency}):</span><span>{form.currency === 'USD' ? '$' : 'R'}{parseFloat(form.amount) || 0}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-end gap-3">
                    <Link href="/payments">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={saving || !selectedClient} className="min-w-[140px]">
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? "Recording..." : "Record Payment"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
