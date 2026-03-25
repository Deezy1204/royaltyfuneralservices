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
import { formatCurrency, PLAN_COLORS } from "@/lib/utils";
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
} from "lucide-react";

const DEFAULT_PLANS = {
  WHITE: {
    name: "Royalty White",
    cover: 15000,
    dependentPremium: 3,
    options: [
      { id: "white_single", name: "Single life (1 person)", premium: 6, maxPeople: 1 },
      { id: "white_family", name: "Family (5 people)", premium: 10, maxPeople: 5 }
    ]
  },
  GOLD: {
    name: "Royalty Gold",
    cover: 25000,
    dependentPremium: 4,
    options: [
      { id: "gold_single", name: "Single life (1 person)", premium: 8, maxPeople: 1 },
      { id: "gold_family", name: "Family (5 people)", premium: 12, maxPeople: 5 },
      { id: "gold_royalty10", name: "Royalty 10 (10 people)", premium: 20, maxPeople: 10 },
      { id: "gold_royalty12", name: "Royalty 12 (12 people)", premium: 25, maxPeople: 12 }
    ]
  },
  BLUE: {
    name: "Royalty Blue",
    cover: 35000,
    dependentPremium: 5,
    options: [
      { id: "blue_single", name: "Single life (1 person)", premium: 12, maxPeople: 1 },
      { id: "blue_family", name: "Family (5 people)", premium: 15, maxPeople: 5 },
      { id: "blue_group", name: "Group", premium: 20, maxPeople: 10 }
    ]
  },
  PURPLE: {
    name: "Royalty Purple",
    cover: 50000,
    dependentPremium: 6,
    options: [
      { id: "purple_single", name: "Single life (1 person)", premium: 15, maxPeople: 1 },
      { id: "purple_family", name: "Family (5 people)", premium: 20, maxPeople: 5 }
    ]
  },
  OPTIONAL_BENEFITS: {
    ACCIDENTAL_DEATH: [
      { id: "adb_750", cover: 750, premium: 5 },
      { id: "adb_1500", cover: 1500, premium: 7.5 },
      { id: "adb_2000", cover: 2000, premium: 10 }
    ],
    SPOUSAL_DEATH: [
      { id: "sdb_300", cover: 300, premium: 5 },
      { id: "sdb_600", cover: 600, premium: 10 }
    ]
  }
};

const TITLES = ["Mr", "Mrs", "Ms", "Miss", "Dr"];
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
  idNumber: string;
  dateOfBirth: string;
  relationship: string;
  proportion: number;
}

function NewProposalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [dbPlans, setDbPlans] = useState<any>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/plans");
        if (res.ok) {
          const data = await res.json();
          if (!data.plans || Object.keys(data.plans).length === 0) {
              setDbPlans(DEFAULT_PLANS);
          } else {
              setDbPlans(data.plans);
          }
        }
      } catch (err) {
        console.error("Failed to fetch plans", err);
      }
    };
    fetchPlans();
  }, []);

  const [formData, setFormData] = useState({
    clientId: clientId || "",
    policyType: "INDIVIDUAL",
    planType: "",
    proposedCover: 0,
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
  });

  useEffect(() => {
    if (clientId) {
      const fetchClient = async () => {
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
          }));
        }
      };
      fetchClient();
    }
  }, [clientId]);

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlanSelect = (planKey: string) => {
    setSelectedPlan(planKey);
    const planData = dbPlans?.[planKey];
    if (planData) {
      handleChange("planType", planKey);
      handleChange("proposedCover", planData.cover);
      if (planData.options?.length > 0) {
        handleOptionSelect(planData.options[0]);
      }
    }
  };

  const handleOptionSelect = (opt: any) => {
    setSelectedOption(opt);
    handleChange("proposedPremium", opt.premium);
    // Auto-set policy type based on max people
    handleChange("policyType", opt.maxPeople > 1 ? "FAMILY" : "INDIVIDUAL");
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
        proportion: 100,
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
    let total = Number(formData.proposedPremium) || 0;
    const planData = dbPlans?.[selectedPlan];
    
    // Add dependent premiums natively if configured in the new structure
    if (planData?.dependentPremium && dependents.length > 0) {
      total += (dependents.length * Number(planData.dependentPremium));
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
    
    return total;
  };

  const handleSubmit = async (e: React.FormEvent, status: string = "DRAFT") => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...formData,
        proposedPremium: calculateTotalPremium(),
        dependents: dependents.length > 0 ? dependents : undefined,
        beneficiaries: beneficiaries.length > 0 ? beneficiaries : undefined,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={(e) => handleSubmit(e, "DRAFT")} className="space-y-6">
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
            {dbPlans ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {["WHITE", "GOLD", "BLUE", "PURPLE"].map((key) => {
                  const planData = dbPlans[key];
                  if (!planData) return null;
                  const premium = planData.options?.[0]?.premium || 0;
                  const cover = planData.cover || 0;
                  const name = planData.name || key;

                  return (
                    <div
                      key={key}
                      onClick={() => handlePlanSelect(key)}
                      className={`cursor-pointer flex flex-col rounded-lg border-2 p-4 transition-all ${selectedPlan === key
                          ? "border-purple-600 ring-2 ring-purple-200"
                          : "border-gray-200 hover:border-purple-300"
                        }`}
                    >
                      <div>
                        <Badge className="bg-purple-100 text-purple-800">{key}</Badge>
                        <h3 className="mt-2 font-semibold text-gray-900">{name}</h3>
                        <p className="text-2xl font-bold text-purple-600">
                          {formatCurrency(premium)}
                          <span className="text-sm font-normal text-gray-500">/mo+</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
                <div className="py-8 text-center text-sm text-gray-500">Loading plans configuration...</div>
            )}

            {selectedPlan && dbPlans?.[selectedPlan]?.options?.length > 0 && (
              <div className="mt-6 border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Select Plan Variant</h4>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {dbPlans[selectedPlan].options.map((opt: any) => (
                          <div 
                              key={opt.id}
                              onClick={() => handleOptionSelect(opt)}
                              className={`cursor-pointer rounded-lg border p-3 flex justify-between items-center ${selectedOption?.id === opt.id ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500' : 'bg-white hover:bg-gray-50'}`}
                          >
                              <div>
                                  <p className="font-medium text-sm text-gray-900">{opt.name}</p>
                                  <p className="text-xs text-gray-500">Max {opt.maxPeople} people</p>
                              </div>
                              <span className="font-bold text-purple-700">{formatCurrency(opt.premium)}</span>
                          </div>
                      ))}
                  </div>
              </div>
            )}
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
              required
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
        {formData.policyType === "FAMILY" && (
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
                        <h4 className="font-medium text-gray-900">
                          Dependent {index + 1}
                        </h4>
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
        )}

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
                      <Input
                        label="Proportion (%)"
                        type="number"
                        min="1"
                        max="100"
                        value={ben.proportion}
                        onChange={(e) => updateBeneficiary(index, "proportion", Number(e.target.value))}
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

        {/* Summary & Actions */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Monthly Premium</p>
                <p className="text-3xl font-bold text-purple-700">
                  {formatCurrency(calculateTotalPremium())}
                </p>
                {dependents.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Including {dependents.length} dependent(s)
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Link href="/proposals">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" variant="secondary" loading={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e, "SUBMITTED")}
                  loading={loading}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit Proposal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
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
