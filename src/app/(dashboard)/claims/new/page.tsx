"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Save, Send, FileText, User, Calendar, MapPin, Stethoscope, AlertCircle, Search, FileCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { SignatureSelector } from "@/components/SignatureSelector";
import { DEFAULT_PLANS } from "@/lib/plans";

// Types
interface DeclarationFormData {
    clientId: string;
    declarantName: string;
    declarantIdNumber: string;
    declarantRelation: string;
    declarantPhone: string;
    deceasedName: string;
    deceasedIdNumber: string;
    deceasedDOD: string;
    servicesRendered: {
        bodyRemoval: boolean;
        groceryAllowance: boolean;
        airtimeAllowance: boolean;
        mortuaryServices: boolean;
        transportForMourners: boolean;
        hearseTrailer: boolean;
        gravesiteEquipment: boolean;
        cashBack: boolean;
        cashInLeau: boolean;
    };
}

interface ClaimFormData {
    policyId: string;
    deceasedType: "PRINCIPAL" | "DEPENDENT";
    dependentId?: string;
    claimType: string;
    // Moved from declaration
    declarantAddress: string;
    employeeNumber?: string;
    deceasedDOB: string;
    causeOfDeath: string;
    placeOfDeath: string;
    burialPlace: string;
    approximateDistance?: string;
}

const CURRENCIES = ["ZAR", "USD"];

const STEPS = {
    CLAIM: 1,
    DECLARATION: 2,
};

const SERVICES_LIST = [
    { id: "bodyRemoval", label: "Body Removal" },
    { id: "groceryAllowance", label: "Grocery Allowance" },
    { id: "airtimeAllowance", label: "Airtime Allowance" },
    { id: "mortuaryServices", label: "Mortuary Services" },
    { id: "transportForMourners", label: "Transport for Mourners" },
    { id: "hearseTrailer", label: "Hearse / Trailer" },
    { id: "gravesiteEquipment", label: "Gravesite Equipment" },
    { id: "cashBack", label: "Cash Back (Cash Plan)" },
    { id: "cashInLeau", label: "Cash-in-leau" },
];

function NewClaimContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const clientIdParam = searchParams.get("clientId");
    const policyIdParam = searchParams.get("policyId");
    const declarationIdParam = searchParams.get("declarationId");

    const claimIdParam = searchParams.get("claimId");
    const stepParam = searchParams.get("step");

    const [step, setStep] = useState(stepParam === "declaration" ? STEPS.DECLARATION : STEPS.CLAIM);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [declarationId, setDeclarationId] = useState<string | null>(declarationIdParam);
    const [claimId, setClaimId] = useState<string | null>(claimIdParam);
    const [declarantSignature, setDeclarantSignature] = useState<string | null>(null);
    const [officerSignature, setOfficerSignature] = useState<string | null>(null);

    // Client Search State
    const [clientSearch, setClientSearch] = useState("");
    const [clientResults, setClientResults] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Data fetching state
    const [policies, setPolicies] = useState<any[]>([]);
    const [dependents, setDependents] = useState<any[]>([]);

    // Form State
    const [declarationData, setDeclarationData] = useState<DeclarationFormData>({
        clientId: clientIdParam || "",
        declarantName: "",
        declarantIdNumber: "",
        declarantRelation: "",
        declarantPhone: "",
        deceasedName: "",
        deceasedIdNumber: "",
        deceasedDOD: "",
        servicesRendered: {
            bodyRemoval: false,
            groceryAllowance: false,
            airtimeAllowance: false,
            mortuaryServices: false,
            transportForMourners: false,
            hearseTrailer: false,
            gravesiteEquipment: false,
            cashBack: false,
            cashInLeau: false,
        },
    });

    const [claimData, setClaimData] = useState<ClaimFormData>({
        policyId: policyIdParam || "",
        deceasedType: "PRINCIPAL",
        dependentId: "",
        claimType: "DEATH",
        declarantAddress: "",
        employeeNumber: "",
        deceasedDOB: "",
        causeOfDeath: "",
        placeOfDeath: "",
        burialPlace: "",
        approximateDistance: "",
    });

    // Search Functionality
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
        if (declarationData.clientId && clientSearch) return;
        const t = setTimeout(() => searchClients(clientSearch), 300);
        return () => clearTimeout(t);
    }, [clientSearch, declarationData.clientId, searchClients]);

    const selectClient = (client: any) => {
        setDeclarationData(prev => ({ ...prev, clientId: client.id }));
        setClientSearch(`${client.firstName} ${client.lastName}`);
        setShowDropdown(false);
    };

    const clearClient = () => {
        setDeclarationData(prev => ({ ...prev, clientId: "" }));
        setClientSearch("");
    };

    // Fetch declaration if declarationIdParam is present
    useEffect(() => {
        if (declarationIdParam) {
            const fetchDeclaration = async () => {
                setLoading(true);
                try {
                    // Fetch from the full list or we can create a single GET route. 
                    // Let's use the list for now since we just added GET /api/declarations.
                    const res = await fetch(`/api/declarations`);
                    if (res.ok) {
                        const data = await res.json();
                        const decl = data.declarations?.find((d: any) => d.id === declarationIdParam);
                        if (decl) {
                            setDeclarationData({
                                clientId: decl.clientId,
                                declarantName: decl.declarantName,
                                declarantIdNumber: decl.declarantIdNumber,
                                declarantRelation: decl.declarantRelation,
                                declarantPhone: decl.declarantPhone,
                                deceasedName: decl.deceasedName,
                                deceasedIdNumber: decl.deceasedIdNumber,
                                deceasedDOD: decl.deceasedDOD,
                                servicesRendered: decl.servicesRendered,
                            });
                        } else {
                            setError("Declaration not found.");
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch declaration", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchDeclaration();
        }
    }, [declarationIdParam]);

    // Fetch policies when client is selected
    useEffect(() => {
        if (declarationData.clientId) {
            const fetchClientData = async () => {
                try {
                    const res = await fetch(`/api/clients/${declarationData.clientId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setPolicies(data.client.policies || []);

                        // Collect all dependents from all policies
                        const allDependents: any[] = [];
                        data.client.policies?.forEach((p: any) => {
                            if (p.dependents) {
                                Object.entries(p.dependents).forEach(([id, dep]: [string, any]) => {
                                    allDependents.push({ id, ...dep });
                                });
                            }
                        });
                        setDependents(allDependents);
                    }
                } catch (err) {
                    console.error("Failed to fetch client details", err);
                }
            };
            fetchClientData();
        } else {
            setPolicies([]);
            setDependents([]);
        }
    }, [declarationData.clientId]);


    const handleDeclarationChange = (field: keyof DeclarationFormData, value: any) => {
        setDeclarationData(prev => ({ ...prev, [field]: value }));
    };

    const handleServiceToggle = (serviceId: string) => {
        setDeclarationData(prev => ({
            ...prev,
            servicesRendered: {
                ...prev.servicesRendered,
                [serviceId]: !((prev.servicesRendered as any)[serviceId])
            }
        }));
    };

    const handleClaimChange = (field: string, value: string | number) => {
        setClaimData(prev => ({ ...prev, [field]: value }));
    };

    const validateDeclaration = () => {
        if (!declarationData.clientId) return "Client is required";
        if (!declarationData.declarantName) return "Declarant Name is required";
        if (!declarationData.deceasedName) return "Deceased Name is required";
        if (!declarationData.deceasedDOD) return "Date of Death is required";
        return null;
    };

    const isClaimValid = () => {
        if (!declarationData.clientId || !claimData.policyId) return false;
        if (claimData.deceasedType === "DEPENDENT" && !claimData.dependentId) return false;
        
        // Declarant fields
        if (!declarationData.declarantName || !declarationData.declarantIdNumber || !claimData.declarantAddress) return false;
        
        // Deceased fields
        if (!declarationData.deceasedName || !declarationData.deceasedIdNumber || !claimData.deceasedDOB || !declarationData.deceasedDOD) return false;
        
        // Other fields
        if (!claimData.causeOfDeath || !claimData.placeOfDeath || !claimData.burialPlace) return false;
        
        return true;
    };

    const isDeclarationValid = () => {
        if (!declarationData.clientId) return false;
        if (!declarationData.declarantName || !declarationData.declarantIdNumber) return false;
        if (!declarationData.deceasedName || !declarationData.deceasedIdNumber || !declarationData.deceasedDOD) return false;
        
        // Check if at least one service is selected (optional but good practice)
        // const hasService = Object.values(declarationData.servicesRendered).some(Boolean);
        // if (!hasService) return false;

        return true;
    };

    const submitDeclaration = async () => {
        const validationError = validateDeclaration();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/declarations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(declarationData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create declaration");
            }

            const data = await res.json();
            setDeclarationId(data.declaration.id);
            setStep(STEPS.CLAIM);

            // Auto-fill claim deceased info if possible
            setClaimData(prev => ({
                ...prev,
                // Try to match deceased to policy member/dependent could be complex logic here
                // For now, simpler approach
            }))

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const submitClaim = async (status = "PENDING") => {
        if (!claimData.policyId || !declarationData.clientId) {
            setError("Policy and Policyholder are required");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const payload = {
                ...claimData,
                clientId: declarationData.clientId,
                status,
                declarantName: declarationData.declarantName,
                declarantIdNumber: declarationData.declarantIdNumber,
                declarantRelation: declarationData.declarantRelation,
                deceasedName: declarationData.deceasedName,
                deceasedIdNumber: declarationData.deceasedIdNumber,
                deceasedDOD: declarationData.deceasedDOD,
            };

            const method = claimId ? "PUT" : "POST";
            const url = claimId ? `/api/claims/${claimId}` : "/api/claims";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save claim");
            }

            const data = await res.json();
            const savedClaimId = data.claim?.id || claimId;
            setClaimId(savedClaimId);

            if (status === "DRAFT") {
                router.push("/claims");
            } else {
                setStep(STEPS.DECLARATION);
                window.history.pushState(null, "", `?step=declaration&claimId=${savedClaimId}`);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFinalSubmit = async (status = "PENDING") => {
        try {
            setLoading(true);
            const validationError = validateDeclaration();
            if (validationError) {
                setError(`Declaration Error: ${validationError}`);
                setLoading(false);
                return;
            }

            if (!claimId) {
                setError("Cannot create declaration without a saved claim.");
                setLoading(false);
                return;
            }

            const method = declarationId ? "PUT" : "POST";
            const url = declarationId ? `/api/declarations/${declarationId}` : "/api/declarations";

            const declRes = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(declarationData),
            });
            if (!declRes.ok) throw new Error("Failed to save declaration");
            const declData = await declRes.json();
            const newDeclId = declData.declaration?.id || declarationId;
            setDeclarationId(newDeclId);

            // Link to Claim
            await fetch(`/api/claims/${claimId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ declarationId: newDeclId, status: "PENDING" }),
            });

            if (status === "DRAFT") {
                router.push("/declarations");
            } else {
                router.push("/declarations");
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Link href="/claims">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {step === STEPS.CLAIM ? "New Claim" : "Declaration Form"}
                    </h1>
                    <p className="text-gray-500">
                        {step === STEPS.CLAIM ? "Step 1: Claim Details" : "Step 2: Declaration"}
                    </p>
                </div>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}

            {step === STEPS.DECLARATION && (
                <div className="space-y-6">
                    {/* Top: Policy Number Auto-filled */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Policy Number</label>
                                <Input
                                    value={claimData.policyId ? policies.find(p => p.id === claimData.policyId)?.policyNumber || "" : ""}
                                    readOnly
                                    disabled
                                    className="bg-gray-50 font-semibold"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* PART A */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-gray-600" />
                                PART A— Bereaved Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-3">
                            <Input
                                label="Full Name of the deceased"
                                value={declarationData.deceasedName}
                                onChange={(e) => handleDeclarationChange("deceasedName", e.target.value)}
                            />
                            <Input
                                label="Id number"
                                value={declarationData.deceasedIdNumber}
                                onChange={(e) => handleDeclarationChange("deceasedIdNumber", e.target.value)}
                            />
                            <Input
                                label="Date of death"
                                type="date"
                                value={declarationData.deceasedDOD}
                                onChange={(e) => handleDeclarationChange("deceasedDOD", e.target.value)}
                            />
                        </CardContent>
                    </Card>

                    {/* PART B */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-blue-600" />
                                PART B— Service Provided by Royalty Funeral Services
                            </CardTitle>
                            <CardDescription>Please check the services that were rendered</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-3">
                            {SERVICES_LIST.map((service) => (
                                <div key={service.id} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => handleServiceToggle(service.id)}>
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
                                        checked={(declarationData.servicesRendered as any)[service.id]}
                                        readOnly
                                    />
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {service.label}
                                    </label>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* PART C */}
                    <Card className="bg-blue-50/50 border-blue-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-900">
                                <FileText className="h-5 w-5 text-blue-600" />
                                PART C— Declaration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-700 italic border-l-4 border-blue-400 pl-4 py-2">
                                I <span className="font-bold underline">{declarationData.declarantName || "______________________________"}</span> of ID No. <span className="font-bold underline">{declarationData.declarantIdNumber || "______________________________"}</span> do hereby declare that all the information provided by me is correct.
                            </p>
                            <div className="mt-8 space-y-6 bg-white p-6 rounded-lg border border-blue-100">
                                <SignatureSelector 
                                    label="Declarant Signature" 
                                    onSignatureChange={setDeclarantSignature} 
                                />
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <div className="flex items-center gap-4">
                                        <span>Signature:</span>
                                        {declarantSignature ? (
                                            <img src={declarantSignature} alt="Signature" className="h-12 object-contain" />
                                        ) : (
                                            <div className="border-b border-gray-400 w-48 h-10 flex items-end"></div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 items-end">
                                        <span>Date:</span>
                                        <div className="border-b border-gray-400 w-32 h-6">{new Date().toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* PART D */}
                    <Card className="bg-gray-50 border-gray-200 mt-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-gray-900">
                                <FileCheck className="h-5 w-5 text-gray-600" />
                                PART D— For office use only
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input label="Received by:" placeholder="Name of Official" />
                                <Input label="Designation:" placeholder="Job Title" />
                            </div>
                            <div className="mt-6 space-y-6 bg-white p-6 rounded-lg border border-gray-200">
                                <SignatureSelector 
                                    label="Officer Signature" 
                                    onSignatureChange={setOfficerSignature} 
                                />
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <div className="flex items-center gap-4">
                                        <span>date & time stamp:</span>
                                        <div className="border-b border-gray-400 w-48 h-10 flex items-end">{new Date().toLocaleString()}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span>signature:</span>
                                        {officerSignature ? (
                                            <img src={officerSignature} alt="Officer Signature" className="h-12 object-contain" />
                                        ) : (
                                            <div className="border-b border-gray-400 w-48 h-10 flex items-end"></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-between pt-6">
                        <Button variant="outline" onClick={() => setStep(STEPS.CLAIM)}>
                            Back to Claim Details
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => handleFinalSubmit("DRAFT")} loading={loading}>
                                Save Draft
                            </Button>
                            <Button disabled={!isDeclarationValid() || loading} onClick={() => handleFinalSubmit("PENDING")} loading={loading}>
                                Submit Final <Send className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {step === STEPS.CLAIM && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-purple-600" />
                                Policy Holder Details (Claimant)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Client Search */}
                            <div className="space-y-1" ref={searchRef}>
                                <label className="text-sm font-medium">Select Policyholders</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        className="w-full h-10 rounded-md border border-gray-200 pl-9 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                        placeholder="Search by name or ID number..."
                                        value={clientSearch}
                                        onChange={e => { setClientSearch(e.target.value); if (declarationData.clientId) clearClient(); }}
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-purple-600" />
                                Claim Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Policy</label>
                                <Select
                                    value={claimData.policyId}
                                    onValueChange={(v) => handleClaimChange("policyId", v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Policy" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {policies.map(policy => (
                                            <SelectItem key={policy.id} value={policy.id}>
                                                {policy.policyNumber} - {policy.planType} - {formatCurrency(policy.coverAmount || 0)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Deceased Type</label>
                                <Select
                                    value={claimData.deceasedType}
                                    onValueChange={(v) => handleClaimChange("deceasedType", v as any)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PRINCIPAL">Principal Member / Self</SelectItem>
                                        <SelectItem value="DEPENDENT">Dependent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {claimData.deceasedType === "DEPENDENT" && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Select Dependent</label>
                                    <Select
                                        value={claimData.dependentId}
                                        onValueChange={(v) => handleClaimChange("dependentId", v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Dependent" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {dependents.map(dep => (
                                                <SelectItem key={dep.id} value={dep.id}>
                                                    {dep.firstName} {dep.lastName} (ID: {dep.idNumber})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-purple-700">Claim Amount (Cash Benefit)</label>
                                <div className="h-10 rounded-md border border-purple-200 bg-purple-50 px-3 flex items-center text-sm font-bold text-purple-900 shadow-sm">
                                    {claimData.policyId ? (
                                        formatCurrency(DEFAULT_PLANS[policies.find(p => p.id === claimData.policyId)?.planType as keyof typeof DEFAULT_PLANS]?.cashBenefit || 0)
                                    ) : (
                                        <span className="text-gray-400 font-normal italic">Select a policy to see benefit</span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* PART A */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                PART A- PRINCIPAL MEMBER’S DETAILS
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Full Name of Principal Member"
                                value={declarationData.declarantName}
                                onChange={(e) => handleDeclarationChange("declarantName", e.target.value)}
                            />
                            <Input
                                label="ID No."
                                value={declarationData.declarantIdNumber}
                                onChange={(e) => handleDeclarationChange("declarantIdNumber", e.target.value)}
                            />
                            <Input
                                label="Policy Type"
                                value={claimData.policyId ? policies.find(p => p.id === claimData.policyId)?.planType || "" : ""}
                                readOnly
                                disabled
                            />
                            <Input
                                label="Policy Number"
                                value={claimData.policyId ? policies.find(p => p.id === claimData.policyId)?.policyNumber || "" : ""}
                                readOnly
                                disabled
                            />
                            <Input
                                label="Employee No."
                                value={claimData.employeeNumber}
                                onChange={(e) => handleClaimChange("employeeNumber", e.target.value)}
                            />
                            <Input
                                label="Address"
                                value={claimData.declarantAddress}
                                onChange={(e) => handleClaimChange("declarantAddress", e.target.value)}
                            />
                        </CardContent>
                    </Card>

                    {/* PART B */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-gray-600" />
                                PART B - DETAILS OF THE DECEASED
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Name of Deceased"
                                value={declarationData.deceasedName}
                                onChange={(e) => handleDeclarationChange("deceasedName", e.target.value)}
                            />
                            <Input
                                label="Cause of Death"
                                value={claimData.causeOfDeath}
                                onChange={(e) => handleClaimChange("causeOfDeath", e.target.value)}
                            />
                            <Input
                                label="ID/ BC Number"
                                value={declarationData.deceasedIdNumber}
                                onChange={(e) => handleDeclarationChange("deceasedIdNumber", e.target.value)}
                            />
                            <Input
                                label="Relationship to Policy Holder"
                                value={declarationData.declarantRelation}
                                onChange={(e) => handleDeclarationChange("declarantRelation", e.target.value)}
                            />
                            <Input
                                label="Date of Birth"
                                type="date"
                                value={claimData.deceasedDOB}
                                onChange={(e) => handleClaimChange("deceasedDOB", e.target.value)}
                            />
                            <Input
                                label="Date of Death"
                                type="date"
                                value={declarationData.deceasedDOD}
                                onChange={(e) => handleDeclarationChange("deceasedDOD", e.target.value)}
                            />
                            <Input
                                label="Place of Death"
                                value={claimData.placeOfDeath}
                                onChange={(e) => handleClaimChange("placeOfDeath", e.target.value)}
                            />
                            <Input
                                label="Place of Burial"
                                value={claimData.burialPlace}
                                onChange={(e) => handleClaimChange("burialPlace", e.target.value)}
                            />
                            <Input
                                label="Approximate Distance"
                                value={claimData.approximateDistance}
                                onChange={(e) => handleClaimChange("approximateDistance", e.target.value)}
                            />
                        </CardContent>
                    </Card>

                    {/* PART C */}
                    <Card className="bg-blue-50/50 border-blue-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-900">
                                <FileText className="h-5 w-5 text-blue-600" />
                                PART C - DECLARATION
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-700 italic border-l-4 border-blue-400 pl-4 py-2">
                                I <span className="font-bold underline">{declarationData.declarantName || "______________________________"}</span> of ID No. <span className="font-bold underline">{declarationData.declarantIdNumber || "______________________________"}</span> do hereby declare that all the information provided by me is correct.
                            </p>
                            <div className="mt-8 space-y-6 bg-white p-6 rounded-lg border border-blue-100">
                                <SignatureSelector 
                                    label="Declarant Signature" 
                                    onSignatureChange={setDeclarantSignature} 
                                />
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <div className="flex items-center gap-4">
                                        <span>Signature:</span>
                                        {declarantSignature ? (
                                            <img src={declarantSignature} alt="Signature" className="h-12 object-contain" />
                                        ) : (
                                            <div className="border-b border-gray-400 w-48 h-10 flex items-end"></div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 items-end">
                                        <span>Date:</span>
                                        <div className="border-b border-gray-400 w-32 h-6">{new Date().toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* PART D */}
                    <Card className="bg-gray-50 border-gray-200 mt-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-gray-900">
                                <FileCheck className="h-5 w-5 text-gray-600" />
                                PART D— For office use only
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input label="Received by:" placeholder="Name of Official" />
                                <Input label="Designation:" placeholder="Job Title" />
                            </div>
                            <div className="mt-6 space-y-6 bg-white p-6 rounded-lg border border-gray-200">
                                <SignatureSelector 
                                    label="Officer Signature" 
                                    onSignatureChange={setOfficerSignature} 
                                />
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <div className="flex items-center gap-4">
                                        <span>date & time stamp:</span>
                                        <div className="border-b border-gray-400 w-48 h-10 flex items-end">{new Date().toLocaleString()}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span>signature:</span>
                                        {officerSignature ? (
                                            <img src={officerSignature} alt="Officer Signature" className="h-12 object-contain" />
                                        ) : (
                                            <div className="border-b border-gray-400 w-48 h-10 flex items-end"></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-between pt-6">
                        <Button variant="outline" onClick={() => router.push("/claims")}>
                            Cancel
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => submitClaim("DRAFT")} disabled={!isClaimValid()} loading={loading}>
                                Save Claim as Draft
                            </Button>
                            <Button disabled={!isClaimValid() || loading} onClick={() => submitClaim("PENDING")} loading={loading}>
                                Save Claim & Proceed to Declaration <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function NewClaimPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewClaimContent />
        </Suspense>
    );
}
