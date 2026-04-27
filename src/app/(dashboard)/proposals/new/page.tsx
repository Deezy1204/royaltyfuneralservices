"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, PLAN_COLORS, calculateAge } from "@/lib/utils";
import {
  ArrowLeft,
  Save,
  Send,
  User,
  FileText,
  CreditCard,
  Users,
  Plus,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { SignatureSelector } from "@/components/SignatureSelector";
import { useLoading } from "@/components/providers/LoadingProvider";

import { DEFAULT_PLANS } from "@/lib/plans";

const TITLES = ["Mr", "Mrs", "Ms", "Miss", "Dr"];
const MARITAL_STATUSES = ["Single", "Married", "Divorced", "Widowed", "Separated"];
const GENDERS = ["Male", "Female"];
const POLICY_TYPES = ["INDIVIDUAL", "FAMILY"];
const PAYMENT_FREQUENCIES = ["MONTHLY", "QUARTERLY", "ANNUALLY"];
const PAYMENT_METHODS = ["DEBIT_ORDER", "CASH", "EFT", "CARD"];
const RELATIONSHIPS = ["SPOUSE", "CHILD", "PARENT", "SIBLING", "EXTENDED"];

interface Dependent {
  firstName: string;
  lastName: string;
  idNumber: string;
  dateOfBirth: string;
  gender: string;
  relationship: string;
  coverAmount: number;
}

interface Beneficiary {
  firstName: string;
  lastName: string;
  idNumber?: string;
  dateOfBirth: string;
  relationship: string;
}

function NewProposalContent() {
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [dbPlans, setDbPlans] = useState<any>(null);
  const [selectedTierLabel, setSelectedTierLabel] = useState<string | null>(null);

  // Disable main dashboard scroll and handle it locally
  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      const originalOverflow = mainElement.style.overflow;
      mainElement.style.overflow = 'hidden';
      return () => {
        mainElement.style.overflow = originalOverflow;
      };
    }
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      startLoading("Initializing plans...");
      try {
        const res = await fetch("/api/plans");
        if (res.ok) {
          const data = await res.json();
          const plansFromDb = data.plans || {};
          const finalPlans = { ...DEFAULT_PLANS } as any;
          
          // Only use DB plan if it has the new structure
          Object.keys(plansFromDb).forEach(key => {
            if (plansFromDb[key] && plansFromDb[key].ageTiers) {
              finalPlans[key] = plansFromDb[key];
            }
          });

          setDbPlans(finalPlans);
        }
      } catch (err) {
        console.error("Failed to fetch plans", err);
      } finally {
        stopLoading();
      }
    };
    fetchPlans();
  }, [startLoading, stopLoading]);

  const [formData, setFormData] = useState({
    clientId: clientId || "",
    policyType: "INDIVIDUAL",
    planServiceType: "SERVICE", // NEW: SERVICE or CASH
    planType: "",
    proposedPremium: 0,
    clientTitle: "",
    clientFirstName: "",
    clientLastName: "",
    clientIdNumber: "",
    clientDOB: "",
    clientGender: "",
    clientPhone: "",
    clientEmail: "",
    clientAddress: "",
    clientCity: "",
    clientPostalCode: "",
    paymentFrequency: "MONTHLY",
    paymentMethod: "",
    bankName: "",
    accountNumber: "",
    branchCode: "",
    debitOrderDay: "",
    notes: "",
    accidentalDeathBenefit: "",
    spousalDeathBenefit: "",
    maritalStatus: "",
    isInsured: "No", // NEW: Yes or No
  });

  const [clientSignature, setClientSignature] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      const fetchClient = async () => {
        startLoading("Loading client data...");
        try {
          const res = await fetch(`/api/clients/${clientId}`);
          if (res.ok) {
            const data = await res.json();
            const client = data.client;
            setFormData((prev) => ({
              ...prev,
              clientTitle: client.title || "",
              clientFirstName: client.firstName,
              clientLastName: client.lastName,
              clientIdNumber: client.idNumber,
              clientDOB: client.dateOfBirth.split("T")[0],
              clientGender: client.gender,
              clientPhone: client.phone,
              clientEmail: client.email || "",
              clientAddress: client.streetAddress,
              clientCity: client.city,
              clientPostalCode: client.postalCode || "",
              bankName: client.bankName || "",
              accountNumber: client.accountNumber || "",
              branchCode: client.branchCode || "",
              maritalStatus: client.maritalStatus || "",
            }));
          }
        } finally {
          stopLoading();
        }
      };
      fetchClient();
    }
  }, [clientId, startLoading, stopLoading]);

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      // If DOB changes and a plan is already selected, update the base premium
      if (field === "clientDOB") {
        const tier = getTierForAge(selectedPlan || "BASIC", value as string);
        if (tier) setSelectedTierLabel(tier.label);
        
        if (selectedPlan && selectedOption && tier && tier.options && tier.options[selectedOption.id]) {
            newData.proposedPremium = tier.options[selectedOption.id];
        }
      }
      
      return newData;
    });
  };

  const getTierForAge = (planKey: string, dob: string) => {
    const plan = (dbPlans && dbPlans[planKey]) ? dbPlans[planKey] : (DEFAULT_PLANS as any)[planKey];
    if (!plan || !plan.ageTiers) return null;

    let age = calculateAge(dob);
    
    // Default to the first tier (18-64) if age is 0 (empty DOB) for preview
    if (age === 0) return plan.ageTiers[0];
    
    if (age >= 85) age = 84;

    const tier = plan.ageTiers.find((t: any) => age >= t.minAge && age <= t.maxAge);
    if (!tier && age < plan.ageTiers[0].minAge) {
      return plan.ageTiers[0];
    }
    return tier || null;
  };

  const getActiveTier = (planKey: string) => {
    const plan = (dbPlans && dbPlans[planKey]) ? dbPlans[planKey] : (DEFAULT_PLANS as any)[planKey];
    if (!plan || !plan.ageTiers) return null;

    if (selectedTierLabel) {
        const manualTier = plan.ageTiers.find((t: any) => t.label === selectedTierLabel);
        if (manualTier) return manualTier;
    }

    return getTierForAge(planKey, formData.clientDOB);
  };

  const handlePlanSelect = (planKey: string) => {
    setSelectedPlan(planKey);
    handleChange("planType", planKey);
    
    const tier = getActiveTier(planKey);
    if (tier && tier.options) {
      // Default to SINGLE if available
      handleOptionSelect("SINGLE", tier.options.SINGLE);
    }
  };

  const handleOptionSelect = (optionKey: string, premium: number) => {
    setSelectedOption({ id: optionKey, premium });
    handleChange("proposedPremium", premium);
    
    // Policy type determination
    const isFamily = ["FAMILY", "EXTENDED_FAMILY", "MEMBER_SPOUSE"].includes(optionKey);
    handleChange("policyType", isFamily ? "FAMILY" : "INDIVIDUAL");
  };

  const addDependent = () => {
    if (dependents.length >= 5) {
      toast.error("Maximum of 5 dependents allowed per client.");
      return;
    }
    setDependents([
      ...dependents,
      {
        firstName: "",
        lastName: "",
        idNumber: "",
        dateOfBirth: "",
        gender: "",
        relationship: "",
        coverAmount: 0,
      },
    ]);
  };

  const updateDependent = (index: number, field: string, value: string | number) => {
    const updated = [...dependents];
    updated[index] = { ...updated[index], [field]: value };
    setDependents(updated);
  };

  const removeDependent = (index: number) => {
    setDependents(dependents.filter((_, i) => i !== index));
  };

  const addBeneficiary = () => {
    setBeneficiaries([
      ...beneficiaries,
      {
        firstName: "",
        lastName: "",
        idNumber: "",
        dateOfBirth: "",
        relationship: "",
      },
    ]);
  };

  const updateBeneficiary = (index: number, field: string, value: string | number) => {
    const updated = [...beneficiaries];
    updated[index] = { ...updated[index], [field]: value };
    setBeneficiaries(updated);
  };

  const removeBeneficiary = (index: number) => {
    setBeneficiaries(beneficiaries.filter((_, i) => i !== index));
  };

  const calculateTotalPremium = () => {
    const planKey = selectedPlan;
    if (!planKey) return Number(formData.proposedPremium) || 0;

    let total = Number(formData.proposedPremium) || 0;
    const optionKey = selectedOption?.id;
    
    if (dependents.length > 0) {
      const plan = (dbPlans && dbPlans[planKey]) ? dbPlans[planKey] : (DEFAULT_PLANS as any)[planKey];
      
      // logic for children inclusion
      const includedChildren = optionKey === "FAMILY" ? 5 : 0;
      let childrenActuallyIncluded = 0;

      dependents.forEach(dep => {
        const depTier = getTierForAge(planKey, dep.dateOfBirth);
        if (!depTier) return;

        if (dep.relationship === "CHILD") {
          if (childrenActuallyIncluded < includedChildren) {
            childrenActuallyIncluded++;
            // Included children are $0 extra
          } else {
            total += Number(depTier.dependents.CHILD || 0);
          }
        } else if (dep.relationship === "EXTENDED") {
          total += Number(depTier.dependents.EXTENDED || depTier.dependents.CHILD || 0);
        } else {
          // Other relationships (SPOUSE, SIBLING, etc.) - default to CHILD premium if not specified
          total += Number(depTier.dependents.CHILD || 0);
        }
      });
    }

    // Add optional benefits premiums
    const optionalPlans = dbPlans?.OPTIONAL_BENEFITS || DEFAULT_PLANS.OPTIONAL_BENEFITS;
    
    if (formData.accidentalDeathBenefit) {
      const opt = optionalPlans.ACCIDENTAL_DEATH.find((o: any) => o.id === formData.accidentalDeathBenefit);
      if (opt) total += Number(opt.premium);
    }
    
    if (formData.spousalDeathBenefit) {
      const opt = optionalPlans.SPOUSAL_DEATH.find((o: any) => o.id === formData.spousalDeathBenefit);
      if (opt) total += Number(opt.premium);
    }
    
    if (formData.isInsured === "Yes") {
      total += 1;
    }
    
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.planType) {
      toast.error("Please select a plan");
      return;
    }

    startLoading("Creating Proposal...");
    setLoading(true);
    setError("");

    try {
      const plans = (dbPlans || DEFAULT_PLANS) as any;
      const planData = plans[selectedPlan];
      const depPremium = Number(planData?.dependentPremium || 0);

      const payload = {
        ...formData,
        proposedPremium: calculateTotalPremium(),
        dependents: dependents.length > 0 ? dependents.map(d => ({
          ...d,
          premium: depPremium
        })) : undefined,
        beneficiaries: beneficiaries.length > 0 ? beneficiaries : undefined,
        clientSignature,
        status,
      };

      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create proposal");
      }

      const data = await res.json();
      router.push(`/proposals/${data.proposal.id}`);
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.message || "Something went wrong. Please try again.");
      toast.error(err.message || "Failed to create proposal");
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  return (
    <div className="flex flex-col h-full -m-4 lg:-m-6">
      <div className="p-4 lg:p-6 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/proposals">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Proposal</h1>
            <p className="text-gray-500">Create a new policy proposal</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        <form id="proposal-form" onSubmit={(e) => handleSubmit(e, "DRAFT")} className="space-y-6 pb-20">
        {/* Plan Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Select Plan
            </CardTitle>
            <CardDescription>Choose a funeral plan for the client</CardDescription>
          </CardHeader>
          <CardContent>
            {dbPlans || DEFAULT_PLANS ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {["BASIC", "BRONZE", "SILVER", "GOLD"].map((key) => {
                  const planData = (dbPlans && dbPlans[key]) ? dbPlans[key] : (DEFAULT_PLANS as any)[key];
                  if (!planData) return null;
                  
                  const tier = getActiveTier(key);
                  const isAvailable = !!tier;
                  const name = planData.name || key;
                  const cashBenefit = planData.cashBenefit || 0;

                  return (
                    <div
                      key={key}
                      onClick={() => isAvailable && handlePlanSelect(key)}
                      className={`cursor-pointer flex flex-col rounded-lg border-2 p-4 transition-all ${
                        !isAvailable ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200" :
                        selectedPlan === key
                          ? "border-purple-600 ring-2 ring-purple-200"
                          : "border-gray-200 hover:border-purple-300"
                        }`}
                    >
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <Badge className={PLAN_COLORS[key] || "bg-purple-100 text-purple-800"}>{key}</Badge>
                          {!isAvailable && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">UNAVAILABLE</span>}
                        </div>
                        <h3 className="mt-2 font-semibold text-gray-900">{name}</h3>
                        <p className="text-2xl font-bold text-purple-600">
                          {isAvailable ? formatCurrency(tier.options.SINGLE) : "—"}
                          <span className="text-sm font-normal text-gray-500">/mo+</span>
                        </p>
                        <div className="mt-3 space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cash Benefit</p>
                            <p className="text-sm font-semibold text-gray-700">{formatCurrency(cashBenefit)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
                <div className="py-8 text-center text-sm text-gray-500">Loading plans configuration...</div>
            )}

            {selectedPlan && (
              <div className="mt-8 border-t pt-6">
                  <div className="flex flex-col gap-4 mb-6">
                      <div className="flex justify-between items-center sm:flex-row flex-col gap-3">
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Choose Age Group</h4>
                        <div className="flex flex-wrap gap-2">
                             {(dbPlans && dbPlans[selectedPlan] ? dbPlans[selectedPlan] : (DEFAULT_PLANS as any)[selectedPlan]).ageTiers.map((t: any, idx: number) => {
                                 const autoTier = getTierForAge(selectedPlan, formData.clientDOB);
                                 const isAuto = autoTier?.label === t.label;
                                 const isSelected = selectedTierLabel ? selectedTierLabel === t.label : isAuto;
                                 
                                 return (
                                     <Badge 
                                        key={idx} 
                                        onClick={() => {
                                            setSelectedTierLabel(t.label);
                                            // Auto-update premium if option is selected
                                            if (selectedOption && t.options[selectedOption.id]) {
                                                handleChange("proposedPremium", t.options[selectedOption.id]);
                                            }
                                        }}
                                        variant={isSelected ? "default" : "outline"} 
                                        className={`cursor-pointer transition-all px-3 py-1 ${isSelected ? "bg-purple-600 scale-105 shadow-md" : "text-gray-500 border-gray-200 hover:border-purple-300"}`}
                                     >
                                         {t.label} {isAuto && " (Auto)"}
                                     </Badge>
                                 );
                             })}
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 italic">Age group is automatically selected based on DOB, but you can manually override it if needed.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {getActiveTier(selectedPlan) && Object.entries(getActiveTier(selectedPlan).options).map(([optKey, premium]) => {
                          if (premium === 0) return null; // Handle unavailable options (-- in user req)
                          return (
                            <div 
                                key={optKey}
                                onClick={() => handleOptionSelect(optKey, premium as number)}
                                className={`cursor-pointer rounded-lg border p-4 flex flex-col gap-1 transition-all ${selectedOption?.id === optKey ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500' : 'bg-white hover:bg-gray-50'}`}
                            >
                                <p className="font-bold text-xs text-gray-500 uppercase tracking-widest">{optKey.replace('_', ' ')}</p>
                                <span className="font-bold text-lg text-purple-700">{formatCurrency(premium as number)}</span>
                                <p className="text-[10px] text-gray-400">
                                    {optKey === 'FAMILY' ? 'Incl. up to 5 children' : 
                                     optKey === 'SINGLE' ? 'Principal member only' :
                                     optKey === 'MEMBER_SPOUSE' ? 'Principal + Spouse' :
                                     'Extended family coverage'}
                                </p>
                            </div>
                          );
                      })}
                  </div>

                  {/* Benefit preview stored in background */}
                   <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Plan Benefits Preview</p>
                      <ul className="text-xs text-gray-600 grid grid-cols-2 gap-x-6 gap-y-1">
                          {(dbPlans || DEFAULT_PLANS)[selectedPlan]?.benefits.map((b: string, i: number) => (
                              <li key={i} className="flex items-center gap-1.5">
                                  <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                  <span className="truncate">{b}</span>
                              </li>
                          ))}
                      </ul>
                   </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Policy Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-600" />
              Plan Type
            </CardTitle>
            <CardDescription>Select whether this is a Service Plan or Cash Plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => handleChange("planServiceType", "SERVICE")}
                className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                  formData.planServiceType === "SERVICE"
                    ? "border-purple-600 bg-purple-50 ring-2 ring-purple-200"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <p className="font-bold text-gray-900">Service Plan</p>
                <p className="text-xs text-gray-500">Traditional funeral services</p>
              </div>
              <div
                onClick={() => handleChange("planServiceType", "CASH")}
                className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                  formData.planServiceType === "CASH"
                    ? "border-purple-600 bg-purple-50 ring-2 ring-purple-200"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <p className="font-bold text-gray-900">Cash Plan</p>
                <p className="text-xs text-gray-500">Cash payout benefit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insured Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className="h-5 w-5 flex items-center justify-center p-0 rounded-full">?</Badge>
              Is the client currently insured?
            </CardTitle>
            <CardDescription>Specify if the client has an existing insurance policy with another provider</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => handleChange("isInsured", "Yes")}
                className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                  formData.isInsured === "Yes"
                    ? "border-blue-600 bg-blue-50 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <p className="font-bold text-gray-900">Yes</p>
              </div>
              <div
                onClick={() => handleChange("isInsured", "No")}
                className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                  formData.isInsured === "No"
                    ? "border-purple-600 bg-purple-50 ring-2 ring-purple-200"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <p className="font-bold text-gray-900">No</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              Principal Member Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              value={formData.clientTitle}
              onValueChange={(v) => handleChange("clientTitle", v)}
            >
              <SelectTrigger label="Title">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {TITLES.map((title) => (
                  <SelectItem key={title} value={title}>{title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              label="First Name"
              value={formData.clientFirstName}
              onChange={(e) => handleChange("clientFirstName", e.target.value)}
              required
            />

            <Input
              label="Last Name"
              value={formData.clientLastName}
              onChange={(e) => handleChange("clientLastName", e.target.value)}
              required
            />

            <Input
              label="ID Number"
              value={formData.clientIdNumber}
              onChange={(e) => handleChange("clientIdNumber", e.target.value)}
              maxLength={13}
            />

            <Input
              label="Date of Birth"
              type="date"
              value={formData.clientDOB}
              onChange={(e) => handleChange("clientDOB", e.target.value)}
              required
            />

            <Select
              value={formData.clientGender}
              onValueChange={(v) => handleChange("clientGender", v)}
            >
              <SelectTrigger label="Gender">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={formData.maritalStatus}
              onValueChange={(v) => handleChange("maritalStatus", v)}
            >
              <SelectTrigger label="Marital Status">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {MARITAL_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              label="Phone"
              type="tel"
              value={formData.clientPhone}
              onChange={(e) => handleChange("clientPhone", e.target.value)}
              required
            />

            <Input
              label="Email"
              type="email"
              value={formData.clientEmail}
              onChange={(e) => handleChange("clientEmail", e.target.value)}
            />

            <Input
              label="Address"
              value={formData.clientAddress}
              onChange={(e) => handleChange("clientAddress", e.target.value)}
              required
            />

            <Input
              label="City"
              value={formData.clientCity}
              onChange={(e) => handleChange("clientCity", e.target.value)}
              required
            />

            <Input
              label="Postal Code"
              value={formData.clientPostalCode}
              onChange={(e) => handleChange("clientPostalCode", e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Dependents */}
        <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Dependents
                  </CardTitle>
                  <CardDescription>Add family members to cover</CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={addDependent}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Dependent
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dependents.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No dependents added. Click &quot;Add Dependent&quot; to add family members.
                </p>
              ) : (
                <div className="space-y-4">
                  {dependents.map((dep, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-gray-200 p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h4 className="font-medium text-gray-900">
                              Dependent {index + 1}
                            </h4>
                            {dep.dateOfBirth && (
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                                    Age: {calculateAge(dep.dateOfBirth)}
                                </Badge>
                            )}
                            {selectedPlan && dep.dateOfBirth && (
                                <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50">
                                    Premium: {formatCurrency(
                                        (() => {
                                            const tier = getTierForAge(selectedPlan, dep.dateOfBirth);
                                            if (!tier) return 0;
                                            
                                            // Handle inclusion logic roughly for display
                                            if (dep.relationship === "CHILD") {
                                                const childrenBefore = dependents.slice(0, index).filter(d => d.relationship === "CHILD").length;
                                                const included = selectedOption?.id === "FAMILY" ? 5 : 0;
                                                return childrenBefore < included ? 0 : (tier.dependents.CHILD || 0);
                                            }
                                            return dep.relationship === "EXTENDED" ? (tier.dependents.EXTENDED || tier.dependents.CHILD || 0) : (tier.dependents.CHILD || 0);
                                        })()
                                    )}
                                </Badge>
                            )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDependent(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Input
                          label="First Name"
                          value={dep.firstName}
                          onChange={(e) =>
                            updateDependent(index, "firstName", e.target.value)
                          }
                          required
                        />
                        <Input
                          label="Last Name"
                          value={dep.lastName}
                          onChange={(e) =>
                            updateDependent(index, "lastName", e.target.value)
                          }
                          required
                        />
                        <Input
                          label="ID Number"
                          value={dep.idNumber}
                          onChange={(e) =>
                            updateDependent(index, "idNumber", e.target.value)
                          }
                        />
                        <Input
                          label="Date of Birth"
                          type="date"
                          value={dep.dateOfBirth}
                          onChange={(e) =>
                            updateDependent(index, "dateOfBirth", e.target.value)
                          }
                          required
                        />
                        <Select
                          value={dep.gender}
                          onValueChange={(v) => updateDependent(index, "gender", v)}
                        >
                          <SelectTrigger label="Gender">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {GENDERS.map((g) => (
                              <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={dep.relationship}
                          onValueChange={(v) =>
                            updateDependent(index, "relationship", v)
                          }
                        >
                          <SelectTrigger label="Relationship">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {RELATIONSHIPS.map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        {/* Beneficiaries */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Beneficiaries
                </CardTitle>
                <CardDescription>Add policy beneficiaries</CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={addBeneficiary}>
                <Plus className="mr-2 h-4 w-4" />
                Add Beneficiary
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {beneficiaries.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No beneficiaries added.
              </p>
            ) : (
              <div className="space-y-4">
                {beneficiaries.map((ben, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        Beneficiary {index + 1}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBeneficiary(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Input
                        label="First Name"
                        value={ben.firstName}
                        onChange={(e) => updateBeneficiary(index, "firstName", e.target.value)}
                        required
                      />
                      <Input
                        label="Last Name"
                        value={ben.lastName}
                        onChange={(e) => updateBeneficiary(index, "lastName", e.target.value)}
                        required
                      />
                      <Input
                        label="ID Number"
                        value={ben.idNumber}
                        onChange={(e) => updateBeneficiary(index, "idNumber", e.target.value)}
                      />
                      <Input
                        label="Date of Birth"
                        type="date"
                        value={ben.dateOfBirth}
                        onChange={(e) => updateBeneficiary(index, "dateOfBirth", e.target.value)}
                        required
                      />
                      <Select
                        value={ben.relationship}
                        onValueChange={(v) => updateBeneficiary(index, "relationship", v)}
                      >
                        <SelectTrigger label="Relationship">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {RELATIONSHIPS.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              value={formData.paymentFrequency}
              onValueChange={(v) => handleChange("paymentFrequency", v)}
            >
              <SelectTrigger label="Payment Frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_FREQUENCIES.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={formData.paymentMethod}
              onValueChange={(v) => handleChange("paymentMethod", v)}
            >
              <SelectTrigger label="Payment Method">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {formData.paymentMethod === "DEBIT_ORDER" && (
              <>
                <Input
                  label="Bank Name"
                  value={formData.bankName}
                  onChange={(e) => handleChange("bankName", e.target.value)}
                />
                <Input
                  label="Account Number"
                  value={formData.accountNumber}
                  onChange={(e) => handleChange("accountNumber", e.target.value)}
                />
                <Input
                  label="Branch Code"
                  value={formData.branchCode}
                  onChange={(e) => handleChange("branchCode", e.target.value)}
                />
                <Input
                  label="Debit Order Day"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.debitOrderDay}
                  onChange={(e) => handleChange("debitOrderDay", e.target.value)}
                  helperText="Day of month (1-31)"
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Optional Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-600" />
              Optional Benefits
            </CardTitle>
            <CardDescription>Enhance the policy with additional riders</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-900">Accidental Death Benefit (Lump-sum)</label>
              <div className="grid gap-2">
                <div 
                  onClick={() => handleChange("accidentalDeathBenefit", "")}
                  className={`cursor-pointer rounded-lg border p-3 flex justify-between items-center text-sm ${formData.accidentalDeathBenefit === "" ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500' : 'bg-white hover:bg-gray-50'}`}
                >
                  <span className="font-medium">None</span>
                </div>
                {(dbPlans?.OPTIONAL_BENEFITS?.ACCIDENTAL_DEATH || DEFAULT_PLANS.OPTIONAL_BENEFITS.ACCIDENTAL_DEATH).map((opt: any) => (
                  <div 
                    key={opt.id}
                    onClick={() => handleChange("accidentalDeathBenefit", opt.id)}
                    className={`cursor-pointer rounded-lg border p-3 flex justify-between items-center text-sm ${formData.accidentalDeathBenefit === opt.id ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500' : 'bg-white hover:bg-gray-50'}`}
                  >
                    <span>${opt.cover} Benefit</span>
                    <span className="font-bold text-purple-700">{formatCurrency(opt.premium)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-900">Spousal / Principal Member Death Benefit</label>
              <div className="grid gap-2">
                <div 
                  onClick={() => handleChange("spousalDeathBenefit", "")}
                  className={`cursor-pointer rounded-lg border p-3 flex justify-between items-center text-sm ${formData.spousalDeathBenefit === "" ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500' : 'bg-white hover:bg-gray-50'}`}
                >
                  <span className="font-medium">None</span>
                </div>
                {(dbPlans?.OPTIONAL_BENEFITS?.SPOUSAL_DEATH || DEFAULT_PLANS.OPTIONAL_BENEFITS.SPOUSAL_DEATH).map((opt: any) => (
                  <div 
                    key={opt.id}
                    onClick={() => handleChange("spousalDeathBenefit", opt.id)}
                    className={`cursor-pointer rounded-lg border p-3 flex justify-between items-center text-sm ${formData.spousalDeathBenefit === opt.id ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500' : 'bg-white hover:bg-gray-50'}`}
                  >
                    <span>${opt.cover} Benefit</span>
                    <span className="font-bold text-purple-700">{formatCurrency(opt.premium)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
              placeholder="Any additional information..."
            />
          </CardContent>
        </Card>

        {/* Declaration & Signature */}
        <Card className="border-purple-200">
          <CardHeader className="bg-purple-50/50">
            <CardTitle className="text-purple-900 uppercase">Declaration</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <p className="text-sm text-gray-700 leading-relaxed text-justify italic border-l-4 border-purple-300 pl-4 bg-gray-50/50 py-3">
              &quot;I the undersigned do hereby declare that all the information provided by me in this application form is accurate. I also understand the provision of services and 
              payments of proceeds due in respect of this policy shall represent the full and final discharge of Royalty Funeral Services’ liability in the event of death. I agree 
              that my premium shall be adjusted at the company’s discretion in line with inflation and the cost of providing a service from time to time.&quot;
            </p>
            
            <div className="max-w-md mx-auto">
              <SignatureSelector 
                label="Client Signature" 
                onSignatureChange={setClientSignature} 
              />
            </div>
          </CardContent>
        </Card>

        </form>
      </div>

      {/* Sticky Summary Bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-purple-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] p-4 lg:px-12 z-50">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
               <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Monthly Premium</p>
              <p className="text-2xl font-black text-purple-700 leading-none">
                {formatCurrency(calculateTotalPremium())}
              </p>
              {dependents.length > 0 && (
                <p className="text-[10px] text-gray-500 font-medium mt-1">
                  Incl. {dependents.length} dependent(s)
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/proposals">
              <Button variant="ghost" type="button" className="text-gray-500 hover:text-gray-700">
                Cancel
              </Button>
            </Link>
            <Button 
                form="proposal-form"
                type="submit" 
                variant="outline" 
                loading={loading}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button
              type="button"
              form="proposal-form"
              onClick={(e) => handleSubmit(e, "SUBMITTED")}
              loading={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200"
            >
              <Send className="mr-2 h-4 w-4" />
              Submit Proposal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewProposalPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" /></div>}>
      <NewProposalContent />
    </Suspense>
  );
}
