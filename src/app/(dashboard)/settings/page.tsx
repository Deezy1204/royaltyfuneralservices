"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Building2, Save, Shield, Bell, FileText, CreditCard, User, X } from "lucide-react";

import { toast } from "sonner";
import { SignatureSelector } from "@/components/SignatureSelector";

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

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [currentSignature, setCurrentSignature] = useState<string | null>(null);
  const [pendingSignature, setPendingSignature] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plans")
        .then(res => res.json())
        .then(data => {
            if (!data.plans || Object.keys(data.plans).length === 0) {
                setPlans(DEFAULT_PLANS);
            } else {
                setPlans(data.plans);
            }
        })
        .catch(console.error);

    fetch("/api/users")
        .then(res => res.json())
        .then(data => {
            if (data.users) setUsers(data.users);
        })
        .catch(console.error);
  }, []);

  const handleSavePlans = async () => {
      setSaving(true);
      try {
          const res = await fetch("/api/plans", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(plans),
          });
          if (!res.ok) throw new Error("Failed to save plans");
          toast.success("Plan configurations saved successfully");
      } catch (error) {
          toast.error("Error saving plans");
      } finally {
          setSaving(false);
      }
  };

  const handleSaveSignature = async (sig: string | null) => {
    if (!selectedUserId) {
        toast.error("Please select a user first");
        return;
    }
    setSaving(true);
    try {
        const res = await fetch(`/api/users/${selectedUserId}/signature`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ signature: sig }),
        });
        if (!res.ok) throw new Error("Failed to save signature");
        toast.success("Signature updated successfully");
        // Update local users state
        setUsers(users.map(u => u.id === selectedUserId ? { ...u, signature: sig } : u));
        setCurrentSignature(sig);
        setPendingSignature(null);
    } catch (error) {
        toast.error("Error saving signature");
    } finally {
        setSaving(false);
    }
  };

  const handleRemoveSignature = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
        const res = await fetch(`/api/users/${selectedUserId}/signature`, {
            method: "DELETE"
        });
        if (!res.ok) throw new Error("Failed to remove signature");
        toast.success("Signature removed successfully");
        setUsers(users.map(u => u.id === selectedUserId ? { ...u, signature: null } : u));
        setCurrentSignature(null);
    } catch (error) {
        toast.error("Error removing signature");
    } finally {
        setSaving(false);
    }
  };

  const handleUserSelect = (uid: string) => {
    setSelectedUserId(uid);
    const user = users.find(u => u.id === uid);
    setCurrentSignature(user?.signature || null);
    setPendingSignature(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage system configuration and preferences</p>
      </div>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Plan Configuration
          </TabsTrigger>
          <TabsTrigger value="signatures" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Signature Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signatures" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Signature Management
              </CardTitle>
              <CardDescription>Upload or set digital signatures for administrators and directors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select User</label>
                    <Select value={selectedUserId} onValueChange={handleUserSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user to manage signature" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter(u => ["ADMIN", "DIRECTOR"].includes(u.role)).map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.firstName} {u.lastName} ({u.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedUserId && (
                    <div className="pt-2 space-y-4">
                      <SignatureSelector 
                        label="New Signature" 
                        onSignatureChange={(sig) => setPendingSignature(sig)} 
                      />
                      {pendingSignature && (
                        <Button 
                          className="w-full" 
                          onClick={() => handleSaveSignature(pendingSignature)} 
                          loading={saving}
                        >
                          <Save className="mr-2 h-4 w-4" /> Upload to Database
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="border rounded-xl p-6 bg-gray-50 flex flex-col items-center justify-center min-h-[200px]">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Current Signature</h3>
                  {selectedUserId ? (
                    currentSignature ? (
                      <div className="space-y-4 w-full text-center">
                        <div className="bg-white p-4 rounded-lg border shadow-sm mx-auto inline-block">
                          <img src={currentSignature} alt="Signature" className="max-h-32 object-contain" />
                        </div>
                        <div>
                          <Button variant="destructive" size="sm" onClick={handleRemoveSignature} loading={saving}>
                            <X className="mr-2 h-4 w-4" /> Remove Signature
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 italic text-sm">No signature uploaded for this user</p>
                    )
                  ) : (
                    <div className="text-center text-gray-400">
                      <User className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Select a user to view their signature</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Funeral Plan Configuration
              </CardTitle>
              <CardDescription>Configure plan structures, options, and premiums</CardDescription>
            </CardHeader>
            <CardContent>
              {!plans ? (
                  <div className="text-sm text-gray-500">Loading configurations...</div>
              ) : (
                <div className="space-y-8">
                  {/* Base Plans Configuration */}
                  {["WHITE", "GOLD", "BLUE", "PURPLE"].map((planKey) => {
                    const planConfig = plans[planKey];
                    if (!planConfig) return null;
                    return (
                      <div key={planKey} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-3 mb-4">
                          <Badge variant={planKey.toLowerCase() as any}>{planKey}</Badge>
                          <span className="font-semibold text-lg">{planConfig.name}</span>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-1 mb-6">
                            <Input 
                                label="Added Dependent Premium ($)" 
                                type="number" 
                                value={planConfig.dependentPremium} 
                                onChange={(e) => setPlans({...plans, [planKey]: {...planConfig, dependentPremium: Number(e.target.value)}})} 
                            />
                        </div>
                        
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700">Plan Options (Single, Family, etc)</h4>
                            {planConfig.options.map((opt: any, idx: number) => (
                                <div key={opt.id} className="grid gap-3 sm:grid-cols-3 bg-white p-3 border rounded">
                                    <Input 
                                        label="Option Name" 
                                        value={opt.name} 
                                        onChange={(e) => {
                                            const newOps = [...planConfig.options];
                                            newOps[idx].name = e.target.value;
                                            setPlans({...plans, [planKey]: {...planConfig, options: newOps}});
                                        }} 
                                    />
                                    <Input 
                                        label="Premium ($)" 
                                        type="number" 
                                        value={opt.premium} 
                                        onChange={(e) => {
                                            const newOps = [...planConfig.options];
                                            newOps[idx].premium = Number(e.target.value);
                                            setPlans({...plans, [planKey]: {...planConfig, options: newOps}});
                                        }} 
                                    />
                                    <Input 
                                        label="Max Covered People" 
                                        type="number" 
                                        value={opt.maxPeople} 
                                        onChange={(e) => {
                                            const newOps = [...planConfig.options];
                                            newOps[idx].maxPeople = Number(e.target.value);
                                            setPlans({...plans, [planKey]: {...planConfig, options: newOps}});
                                        }} 
                                    />
                                </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Optional Benefits Configuration */}
                  <div className="border rounded-lg p-4 bg-purple-50">
                      <h3 className="font-semibold text-lg mb-4 text-purple-900">Optional Benefits</h3>
                      
                      <div className="space-y-6">
                          <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Accidental Death Benefit (Lump-Sum)</h4>
                              <div className="grid gap-3 sm:grid-cols-3">
                                  {plans.OPTIONAL_BENEFITS?.ACCIDENTAL_DEATH?.map((ben: any, idx: number) => (
                                      <div key={idx} className="bg-white p-3 border rounded space-y-2">
                                          <p className="text-xs font-medium text-gray-500 uppercase">Tier {idx + 1}</p>
                                          <Input label="Cover Amount ($)" type="number" value={ben.cover} onChange={(e) => { const n = [...plans.OPTIONAL_BENEFITS.ACCIDENTAL_DEATH]; n[idx].cover = Number(e.target.value); setPlans({...plans, OPTIONAL_BENEFITS: {...plans.OPTIONAL_BENEFITS, ACCIDENTAL_DEATH: n}}); }} />
                                          <Input label="Premium ($)" type="number" value={ben.premium} onChange={(e) => { const n = [...plans.OPTIONAL_BENEFITS.ACCIDENTAL_DEATH]; n[idx].premium = Number(e.target.value); setPlans({...plans, OPTIONAL_BENEFITS: {...plans.OPTIONAL_BENEFITS, ACCIDENTAL_DEATH: n}}); }} />
                                      </div>
                                  ))}
                              </div>
                          </div>

                          <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Spousal / Principal Member Death</h4>
                              <div className="grid gap-3 sm:grid-cols-3">
                                  {plans.OPTIONAL_BENEFITS?.SPOUSAL_DEATH?.map((ben: any, idx: number) => (
                                      <div key={idx} className="bg-white p-3 border rounded space-y-2">
                                          <p className="text-xs font-medium text-gray-500 uppercase">Tier {idx + 1}</p>
                                          <Input label="Cover Amount ($)" type="number" value={ben.cover} onChange={(e) => { const n = [...plans.OPTIONAL_BENEFITS.SPOUSAL_DEATH]; n[idx].cover = Number(e.target.value); setPlans({...plans, OPTIONAL_BENEFITS: {...plans.OPTIONAL_BENEFITS, SPOUSAL_DEATH: n}}); }} />
                                          <Input label="Premium ($)" type="number" value={ben.premium} onChange={(e) => { const n = [...plans.OPTIONAL_BENEFITS.SPOUSAL_DEATH]; n[idx].premium = Number(e.target.value); setPlans({...plans, OPTIONAL_BENEFITS: {...plans.OPTIONAL_BENEFITS, SPOUSAL_DEATH: n}}); }} />
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>

                </div>
              )}
              <div className="flex justify-end mt-6">
                <Button onClick={handleSavePlans} loading={saving} disabled={!plans}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Plan Configurations
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
