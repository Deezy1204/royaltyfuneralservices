"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, User, MapPin, Briefcase, Building2 } from "lucide-react";
import { useLoading } from "@/components/providers/LoadingProvider";

const TITLES = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Prof", "Rev"];
const GENDERS = ["Male", "Female", "Other"];
const MARITAL_STATUSES = ["Single", "Married", "Divorced", "Widowed", "Separated"];
const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];
const ACCOUNT_TYPES = ["Savings", "Cheque", "Current", "Transmission"];

export default function NewClientPage() {
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    firstName: "",
    middleName: "",
    lastName: "",
    idNumber: "",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    phone: "",
    altPhone: "",
    email: "",
    streetAddress: "",
    suburb: "",
    city: "",
    province: "",
    postalCode: "",
    country: "South Africa",
    occupation: "",
    employer: "",
    employerAddress: "",
    bankName: "",
    accountNumber: "",
    branchCode: "",
    accountType: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startLoading("Registering Client...");
    setLoading(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create client");
      }

      const data = await res.json();
      router.push(`/clients/${data.client.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Register New Client</h1>
          <p className="text-gray-500">Enter client details to create a new record</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              Personal Information
            </CardTitle>
            <CardDescription>Basic details about the client</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Select value={formData.title} onValueChange={(v) => handleChange("title", v)}>
              <SelectTrigger label="Title">
                <SelectValue placeholder="Select title" />
              </SelectTrigger>
              <SelectContent>
                {TITLES.map((title) => (
                  <SelectItem key={title} value={title}>{title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              required
            />

            <Input
              label="Middle Name"
              value={formData.middleName}
              onChange={(e) => handleChange("middleName", e.target.value)}
            />

            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              required
            />

            <Input
              label="ID Number"
              value={formData.idNumber}
              onChange={(e) => handleChange("idNumber", e.target.value)}
              required
              maxLength={13}
              helperText="South African ID number (13 digits)"
            />

            <Input
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleChange("dateOfBirth", e.target.value)}
              required
            />

            <Select value={formData.gender} onValueChange={(v) => handleChange("gender", v)}>
              <SelectTrigger label="Gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((gender) => (
                  <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={formData.maritalStatus} onValueChange={(v) => handleChange("maritalStatus", v)}>
              <SelectTrigger label="Marital Status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {MARITAL_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              required
              placeholder="0XX XXX XXXX"
            />

            <Input
              label="Alternative Phone"
              type="tel"
              value={formData.altPhone}
              onChange={(e) => handleChange("altPhone", e.target.value)}
              placeholder="0XX XXX XXXX"
            />

            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="example@email.com"
            />
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              Address Information
            </CardTitle>
            <CardDescription>Residential address details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Street Address"
                value={formData.streetAddress}
                onChange={(e) => handleChange("streetAddress", e.target.value)}
                required
                placeholder="123 Main Street"
              />
            </div>

            <Input
              label="Suburb"
              value={formData.suburb}
              onChange={(e) => handleChange("suburb", e.target.value)}
            />

            <Input
              label="City"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              required
            />

            <Select value={formData.province} onValueChange={(v) => handleChange("province", v)}>
              <SelectTrigger label="Province">
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {PROVINCES.map((province) => (
                  <SelectItem key={province} value={province}>{province}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              label="Postal Code"
              value={formData.postalCode}
              onChange={(e) => handleChange("postalCode", e.target.value)}
              maxLength={4}
            />
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-purple-600" />
              Employment Information
            </CardTitle>
            <CardDescription>Work details (optional)</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Occupation"
              value={formData.occupation}
              onChange={(e) => handleChange("occupation", e.target.value)}
            />

            <Input
              label="Employer"
              value={formData.employer}
              onChange={(e) => handleChange("employer", e.target.value)}
            />

            <div className="sm:col-span-2">
              <Textarea
                label="Employer Address"
                value={formData.employerAddress}
                onChange={(e) => handleChange("employerAddress", e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              Bank Details
            </CardTitle>
            <CardDescription>For claim payouts (optional)</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Bank Name"
              value={formData.bankName}
              onChange={(e) => handleChange("bankName", e.target.value)}
            />

            <Select value={formData.accountType} onValueChange={(v) => handleChange("accountType", v)}>
              <SelectTrigger label="Account Type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              label="Account Number"
              value={formData.accountNumber}
              onChange={(e) => handleChange("accountNumber", e.target.value)}
            />

            <Input
              label="Branch Code"
              value={formData.branchCode}
              onChange={(e) => handleChange("branchCode", e.target.value)}
              maxLength={6}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/clients">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" loading={loading}>
            <Save className="mr-2 h-4 w-4" />
            Save Client
          </Button>
        </div>
      </form>
    </div>
  );
}
