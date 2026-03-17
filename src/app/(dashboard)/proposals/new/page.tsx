"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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

const TITLES = ["Mr", "Mrs", "Ms", "Miss", "Dr"];
const GENDERS = ["Male", "Female"];
const POLICY_TYPES = ["INDIVIDUAL", "FAMILY"];
const PAYMENT_FREQUENCIES = ["MONTHLY", "QUARTERLY", "ANNUALLY"];
const PAYMENT_METHODS = ["DEBIT_ORDER", "CASH", "EFT", "CARD"];
const RELATIONSHIPS = ["SPOUSE", "CHILD", "PARENT", "SIBLING", "EXTENDED"];

const PLAN_CONFIG = {
  WHITE: { name: "White Plan", basePremium: 150, cover: 15000, color: "bg-gray-100" },
  GOLD: { name: "Gold Plan", basePremium: 250, cover: 25000, color: "bg-yellow-100" },
  BLUE: { name: "Blue Plan", basePremium: 350, cover: 35000, color: "bg-blue-100" },
  PURPLE: { name: "Purple Plan", basePremium: 500, cover: 50000, color: "bg-purple-100" },
};

interface Dependent {
  firstName: string;
  lastName: string;
  idNumber: string;
  dateOfBirth: string;
  gender: string;
  relationship: string;
  coverAmount: number;
}

function NewProposalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<keyof typeof PLAN_CONFIG | "">("");
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [dbPlans, setDbPlans] = useState<any[]>([]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/plans");
        if (res.ok) {
          const data = await res.json();
          setDbPlans(data.plans || []);
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

  const handlePlanSelect = (plan: keyof typeof PLAN_CONFIG) => {
    setSelectedPlan(plan);
    const config = PLAN_CONFIG[plan];
    const dbPlan = dbPlans.find((p) => p.planType === plan);

    handleChange("planType", plan);
    handleChange("proposedCover", dbPlan?.principalCover || config.cover);
    handleChange("proposedPremium", dbPlan?.basePremium || config.basePremium);
  };

  const addDependent = () => {
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

  const calculateTotalPremium = () => {
    let total = formData.proposedPremium;
    dependents.forEach((dep) => {
      if (dep.relationship === "SPOUSE") total += 100;
      else if (dep.relationship === "CHILD") total += 50;
      else if (dep.relationship === "PARENT") total += 80;
      else total += 60;
    });
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(PLAN_CONFIG).map(([key, config]) => {
                const dbPlan = dbPlans.find((p) => p.planType === key);
                const features = dbPlan?.features || [];
                const premium = dbPlan?.basePremium || config.basePremium;
                const cover = dbPlan?.principalCover || config.cover;
                const name = dbPlan?.displayName || config.name;

                return (
                  <div
                    key={key}
                    onClick={() => handlePlanSelect(key as keyof typeof PLAN_CONFIG)}
                    className={`cursor-pointer flex flex-col rounded-lg border-2 p-4 transition-all ${selectedPlan === key
                        ? "border-purple-600 ring-2 ring-purple-200"
                        : "border-gray-200 hover:border-purple-300"
                      }`}
                  >
                    <div>
                      <Badge className={PLAN_COLORS[key as keyof typeof PLAN_COLORS] || "bg-gray-100"}>{key}</Badge>
                      <h3 className="mt-2 font-semibold text-gray-900">{name}</h3>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(premium)}
                        <span className="text-sm font-normal text-gray-500">/month</span>
                      </p>
                      <p className="mt-1 text-sm text-gray-500 font-medium pb-3">
                        Cover: {formatCurrency(cover)}
                      </p>
                    </div>
                    {features.length > 0 && (
                      <div className="mt-auto border-t pt-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Benefits include:</p>
                        <ul className="text-sm text-gray-600 space-y-2">
                          {features.map((feature: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0"></div>
                              <span className="leading-snug">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Select
                value={formData.policyType}
                onValueChange={(v) => handleChange("policyType", v)}
              >
                <SelectTrigger label="Policy Type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POLICY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
