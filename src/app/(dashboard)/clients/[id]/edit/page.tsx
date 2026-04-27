"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useLoading } from "@/components/providers/LoadingProvider";
import { User, Shield, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { DEFAULT_PLANS } from "@/lib/plans";

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();
  
  const [formData, setFormData] = useState<any>({
    // Client fields
    title: "",
    firstName: "",
    lastName: "",
    idNumber: "",
    gender: "",
    maritalStatus: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    // Policy fields
    policyId: "",
    planType: "",
    planServiceType: "",
    paymentFrequency: "",
    premiumAmount: 0,
    status: "",
    paymentMethod: "",
    notes: "",
  });

  useEffect(() => {
    fetchClientData();
  }, [id]);

  const fetchClientData = async () => {
    startLoading("Loading client data...");
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (res.ok) {
        const data = await res.json();
        const client = data.client;
        const policy = client.policies && client.policies.length > 0 ? client.policies[0] : null;

        setFormData({
          title: client.title || "",
          firstName: client.firstName || "",
          lastName: client.lastName || "",
          idNumber: client.idNumber || "",
          gender: client.gender || "",
          maritalStatus: client.maritalStatus || "",
          phone: client.phone || "",
          email: client.email || "",
          address: client.address || "",
          city: client.city || "",
          postalCode: client.postalCode || "",
          policyId: policy?.id || "",
          planType: policy?.planType || "",
          planServiceType: policy?.planServiceType || "SERVICE",
          paymentFrequency: policy?.paymentFrequency || "MONTHLY",
          premiumAmount: policy?.premiumAmount || 0,
          status: policy?.status || "",
          paymentMethod: policy?.paymentMethod || "",
          notes: policy?.notes || "",
        });
      }
    } catch (error) {
      toast.error("Failed to load client data");
    } finally {
      stopLoading();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startLoading("Saving changes...");
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Client details updated successfully");
        router.push("/clients");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update details");
      }
    } catch (error) {
      toast.error("An error occurred while saving");
    } finally {
      stopLoading();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Details</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-purple-600" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Select 
                value={formData.title} 
                onValueChange={v => setFormData({...formData, title: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MR">Mr</SelectItem>
                  <SelectItem value="MRS">Mrs</SelectItem>
                  <SelectItem value="MS">Ms</SelectItem>
                  <SelectItem value="DR">Dr</SelectItem>
                  <SelectItem value="PROF">Prof</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input 
                value={formData.firstName} 
                onChange={e => setFormData({...formData, firstName: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input 
                value={formData.lastName} 
                onChange={e => setFormData({...formData, lastName: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>ID Number</Label>
              <Input 
                value={formData.idNumber} 
                onChange={e => setFormData({...formData, idNumber: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select 
                value={formData.gender} 
                onValueChange={v => setFormData({...formData, gender: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Marital Status</Label>
              <Select 
                value={formData.maritalStatus} 
                onValueChange={v => setFormData({...formData, maritalStatus: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">Single</SelectItem>
                  <SelectItem value="MARRIED">Married</SelectItem>
                  <SelectItem value="DIVORCED">Divorced</SelectItem>
                  <SelectItem value="WIDOWED">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Address</Label>
              <Input 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input 
                value={formData.city} 
                onChange={e => setFormData({...formData, city: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Postal Code</Label>
              <Input 
                value={formData.postalCode} 
                onChange={e => setFormData({...formData, postalCode: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        {formData.policyId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-blue-600" />
                Policy Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan Type</Label>
                <Select 
                  value={formData.planType} 
                  onValueChange={v => setFormData({...formData, planType: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(DEFAULT_PLANS).map(plan => (
                      <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Service Type</Label>
                <Select 
                  value={formData.planServiceType} 
                  onValueChange={v => setFormData({...formData, planServiceType: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SERVICE">Service (Funeral)</SelectItem>
                    <SelectItem value="CASH">Cash (Payout)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monthly Premium</Label>
                <Input 
                  type="number"
                  value={formData.premiumAmount} 
                  onChange={e => setFormData({...formData, premiumAmount: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Frequency</Label>
                <Select 
                  value={formData.paymentFrequency} 
                  onValueChange={v => setFormData({...formData, paymentFrequency: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="BI-ANNUAL">Bi-Annual</SelectItem>
                    <SelectItem value="ANNUAL">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Policy Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={v => setFormData({...formData, status: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="LAPSED">Lapsed</SelectItem>
                    <SelectItem value="TERMINATED">Terminated</SelectItem>
                    <SelectItem value="CLAIMED">Claimed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select 
                  value={formData.paymentMethod} 
                  onValueChange={v => setFormData({...formData, paymentMethod: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="DEBIT_ORDER">Debit Order</SelectItem>
                    <SelectItem value="EFT">EFT</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Notes</Label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional policy notes..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Link href="/clients">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
