"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useLoading } from "@/components/providers/LoadingProvider";
import { calculateAge, formatCurrency } from "@/lib/utils";
import { DEFAULT_PLANS } from "@/lib/plans";
import { RefreshCw, User, Shield, CreditCard } from "lucide-react";

interface PolicyTransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claim: any;
  onSuccess: () => void;
}

export function PolicyTransferModal({
  open,
  onOpenChange,
  claim,
  onSuccess,
}: PolicyTransferModalProps) {
  const { startLoading, stopLoading } = useLoading();
  const [dependents, setDependents] = useState<any[]>([]);
  const [selectedDependentId, setSelectedDependentId] = useState<string>("");
  const [policy, setPolicy] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    firstName: "",
    lastName: "",
    idNumber: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    bankName: "",
    accountNumber: "",
    branchCode: "",
    paymentMethod: "",
    planType: "",
    premiumAmount: 0,
  });

  useEffect(() => {
    if (open && claim?.policyId) {
      fetchPolicyDetails();
    }
  }, [open, claim]);

  const fetchPolicyDetails = async () => {
    startLoading("Loading policy details...");
    try {
      const res = await fetch(`/api/policies/${claim.policyId}`);
      if (res.ok) {
        const data = await res.json();
        setPolicy(data.policy);
        
        // Extract dependents from policy
        const deps = data.policy.dependents ? Object.entries(data.policy.dependents).map(([id, d]: any) => ({
          id,
          ...d
        })) : [];
        setDependents(deps);

        // Pre-fill policy info
        setFormData(prev => ({
          ...prev,
          planType: data.policy.planType,
          premiumAmount: data.policy.premiumAmount,
          paymentMethod: data.policy.paymentMethod || "",
        }));
      }
    } catch (error) {
      toast.error("Failed to load policy dependents");
    } finally {
      stopLoading();
    }
  };

  const handleDependentSelect = (id: string) => {
    setSelectedDependentId(id);
    const dep = dependents.find(d => d.id === id);
    if (dep) {
      setFormData(prev => ({
        ...prev,
        firstName: dep.firstName,
        lastName: dep.lastName,
        idNumber: dep.idNumber,
        title: dep.title || "",
      }));
    }
  };

  const handleSubmit = async () => {
    if (!selectedDependentId) {
      toast.error("Please select a dependent to transfer to");
      return;
    }

    startLoading("Transferring policy...");
    try {
      const res = await fetch(`/api/policies/${claim.policyId}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId: claim.id,
          newPrincipalId: selectedDependentId,
          formData: formData
        }),
      });

      if (res.ok) {
        toast.success("Policy transferred successfully");
        onSuccess();
        onOpenChange(false);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to transfer policy");
      }
    } catch (error) {
      toast.error("An error occurred during transfer");
    } finally {
      stopLoading();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            Transfer Policy
          </DialogTitle>
          <DialogDescription>
            Transfer policy {policy?.policyNumber} to a dependent after the death of the principal member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Select Dependent */}
          <div className="space-y-4 rounded-lg border p-4 bg-gray-50">
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <User className="h-4 w-4 text-blue-600" />
              1. Select New Principal Member
            </div>
            <div className="grid gap-2">
              <Label>Available Dependents</Label>
              <Select value={selectedDependentId} onValueChange={handleDependentSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a dependent" />
                </SelectTrigger>
                <SelectContent>
                  {dependents.map((dep) => (
                    <SelectItem key={dep.id} value={dep.id}>
                      {dep.firstName} {dep.lastName} ({dep.relationship})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Step 2: New Client Details */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <Shield className="h-4 w-4 text-purple-600" />
              2. New Principal Details
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input 
                  value={formData.firstName} 
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input 
                  value={formData.lastName} 
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>ID Number</Label>
                <Input 
                  value={formData.idNumber} 
                  onChange={e => setFormData({...formData, idNumber: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          {/* Step 3: Policy Updates */}
          <div className="space-y-4 rounded-lg border p-4 bg-purple-50/50 border-purple-100">
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <CreditCard className="h-4 w-4 text-purple-600" />
              3. Policy & Payment Info
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                <Label>New Monthly Premium</Label>
                <Input 
                  type="number"
                  value={formData.premiumAmount} 
                  onChange={e => setFormData({...formData, premiumAmount: Number(e.target.value)})}
                />
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
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            Complete Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
