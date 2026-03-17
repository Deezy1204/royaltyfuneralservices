"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, User, Phone, MapPin, Briefcase, CreditCard, AlertCircle } from "lucide-react";

const TITLES = ["Mr", "Mrs", "Miss", "Ms", "Dr", "Prof", "Rev"];
const GENDERS = ["MALE", "FEMALE", "OTHER"];
const MARITAL_STATUSES = ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"];
const PROVINCES = ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape"];
const ACCOUNT_TYPES = ["SAVINGS", "CHEQUE", "CURRENT"];

export default function EditClientPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        title: "", firstName: "", middleName: "", lastName: "",
        idNumber: "", dateOfBirth: "", gender: "", maritalStatus: "",
        phone: "", altPhone: "", email: "",
        streetAddress: "", suburb: "", city: "", province: "", postalCode: "", country: "South Africa",
        occupation: "", employer: "", employerAddress: "",
        bankName: "", accountNumber: "", branchCode: "", accountType: "",
    });

    const fetchClient = useCallback(async () => {
        try {
            const res = await fetch(`/api/clients/${id}`);
            if (res.ok) {
                const data = await res.json();
                const c = data.client;
                setForm({
                    title: c.title || "",
                    firstName: c.firstName || "",
                    middleName: c.middleName || "",
                    lastName: c.lastName || "",
                    idNumber: c.idNumber || "",
                    dateOfBirth: c.dateOfBirth ? c.dateOfBirth.split("T")[0] : "",
                    gender: c.gender || "",
                    maritalStatus: c.maritalStatus || "",
                    phone: c.phone || "",
                    altPhone: c.altPhone || "",
                    email: c.email || "",
                    streetAddress: c.streetAddress || "",
                    suburb: c.suburb || "",
                    city: c.city || "",
                    province: c.province || "",
                    postalCode: c.postalCode || "",
                    country: c.country || "South Africa",
                    occupation: c.occupation || "",
                    employer: c.employer || "",
                    employerAddress: c.employerAddress || "",
                    bankName: c.bankName || "",
                    accountNumber: c.accountNumber || "",
                    branchCode: c.branchCode || "",
                    accountType: c.accountType || "",
                });
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

    const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const res = await fetch(`/api/clients/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                router.push(`/clients/${id}`);
            } else {
                const data = await res.json();
                setError(data.error || "Failed to update client");
            }
        } catch {
            setError("Failed to update client");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Link href={`/clients/${id}`}>
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Client</h1>
                    <p className="text-gray-500">Update client details</p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" /> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4 text-purple-600" />Personal Information</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Title</label>
                                <Select value={form.title} onValueChange={(v) => set("title", v)}>
                                    <SelectTrigger><SelectValue placeholder="Title" /></SelectTrigger>
                                    <SelectContent>{TITLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <Input label="First Name" value={form.firstName} onChange={e => set("firstName", e.target.value)} required />
                            <Input label="Middle Name" value={form.middleName} onChange={e => set("middleName", e.target.value)} />
                            <Input label="Last Name" value={form.lastName} onChange={e => set("lastName", e.target.value)} required />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Input label="ID Number" value={form.idNumber} onChange={e => set("idNumber", e.target.value)} required />
                            <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Gender</label>
                                <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Marital Status</label>
                                <Select value={form.maritalStatus} onValueChange={(v) => set("maritalStatus", v)}>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>{MARITAL_STATUSES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Phone className="h-4 w-4 text-blue-600" />Contact Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Phone" value={form.phone} onChange={e => set("phone", e.target.value)} required />
                            <Input label="Alt Phone" value={form.altPhone} onChange={e => set("altPhone", e.target.value)} />
                        </div>
                        <Input label="Email" type="email" value={form.email} onChange={e => set("email", e.target.value)} />
                    </CardContent>
                </Card>

                {/* Address */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-4 w-4 text-green-600" />Address</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <Input label="Street Address" value={form.streetAddress} onChange={e => set("streetAddress", e.target.value)} required />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Suburb" value={form.suburb} onChange={e => set("suburb", e.target.value)} />
                            <Input label="City" value={form.city} onChange={e => set("city", e.target.value)} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Province</label>
                                <Select value={form.province} onValueChange={(v) => set("province", v)}>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>{PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <Input label="Postal Code" value={form.postalCode} onChange={e => set("postalCode", e.target.value)} />
                            <Input label="Country" value={form.country} onChange={e => set("country", e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                {/* Employment */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Briefcase className="h-4 w-4 text-orange-600" />Employment (Optional)</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Occupation" value={form.occupation} onChange={e => set("occupation", e.target.value)} />
                            <Input label="Employer" value={form.employer} onChange={e => set("employer", e.target.value)} />
                        </div>
                        <Input label="Employer Address" value={form.employerAddress} onChange={e => set("employerAddress", e.target.value)} />
                    </CardContent>
                </Card>

                {/* Banking */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4 text-purple-600" />Banking Details (Optional)</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Bank Name" value={form.bankName} onChange={e => set("bankName", e.target.value)} />
                            <Input label="Account Number" value={form.accountNumber} onChange={e => set("accountNumber", e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Branch Code" value={form.branchCode} onChange={e => set("branchCode", e.target.value)} />
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Account Type</label>
                                <Select value={form.accountType} onValueChange={(v) => set("accountType", v)}>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>{ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Link href={`/clients/${id}`}>
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
