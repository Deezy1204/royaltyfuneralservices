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
import { formatCurrency, PLAN_COLORS } from "@/lib/utils";
import { Building2, Save, Shield, Bell, FileText, CreditCard, User, X } from "lucide-react";

import { toast } from "sonner";
import { SignatureSelector } from "@/components/SignatureSelector";

const DEFAULT_PLANS = {
  BASIC: {
    name: "Basic Policy",
    benefits: ["Repatriation up to 600km"],
    cashBenefit: 450,
    ageTiers: [
      {
        label: "18 - 64",
        minAge: 18,
        maxAge: 64,
        options: { SINGLE: 2.5, MEMBER_SPOUSE: 3, FAMILY: 3.5, EXTENDED_FAMILY: 3.5 },
        dependents: { CHILD: 3 }
      }
    ]
  },
  BRONZE: {
    name: "Bronze Policy",
    benefits: ["1 Tier Casket", "Burial Services", "Complimentary Grocery", "Transport (15 Seater Quantum)", "Grave Tent and Chairs", "Repatriation (Over 600km)"],
    cashBenefit: 450,
    ageTiers: [
      {
        label: "18 - 64",
        minAge: 18,
        maxAge: 64,
        options: { SINGLE: 3.5, MEMBER_SPOUSE: 5, FAMILY: 5.5, EXTENDED_FAMILY: 1.5 },
        dependents: { CHILD: 4 }
      },
      {
        label: "65 - 74",
        minAge: 65,
        maxAge: 74,
        options: { SINGLE: 4, MEMBER_SPOUSE: 6, FAMILY: 7, EXTENDED_FAMILY: 3 },
        dependents: { CHILD: 5 }
      },
      {
        label: "75 - 84",
        minAge: 75,
        maxAge: 84,
        options: { SINGLE: 11, MEMBER_SPOUSE: 8.5, FAMILY: 0, EXTENDED_FAMILY: 11 },
        dependents: { CHILD: 0 }
      }
    ]
  },
  SILVER: {
    name: "Royalty Silver",
    benefits: ["1 Tier Casket", "Burial Services", "Complimentary Grocery", "Transport (15 Seater Quantum)", "Grave Tent and Chairs", "Airtime", "Repatriation (Over 600km)"],
    cashBenefit: 550,
    ageTiers: [
      {
        label: "18 - 64",
        minAge: 18,
        maxAge: 64,
        options: { SINGLE: 3.5, MEMBER_SPOUSE: 6, FAMILY: 8.5, EXTENDED_FAMILY: 2 },
        dependents: { CHILD: 5 }
      },
      {
        label: "65 - 74",
        minAge: 65,
        maxAge: 74,
        options: { SINGLE: 4.5, MEMBER_SPOUSE: 7.5, FAMILY: 9.5, EXTENDED_FAMILY: 4.5 },
        dependents: { CHILD: 6 }
      },
      {
        label: "75 - 84",
        minAge: 75,
        maxAge: 84,
        options: { SINGLE: 11.5, MEMBER_SPOUSE: 9, FAMILY: 0, EXTENDED_FAMILY: 12 },
        dependents: { CHILD: 0 }
      }
    ]
  },
  GOLD: {
    name: "Royalty Gold",
    benefits: ["3 Tier Casket", "Burial Services", "Complimentary Grocery", "Transport (15 Seater Quantum)", "Grave Tent and Chairs", "Airtime", "Repatriation (Over 600km)"],
    cashBenefit: 700,
    ageTiers: [
      {
        label: "18 - 64",
        minAge: 18,
        maxAge: 64,
        options: { SINGLE: 5.5, MEMBER_SPOUSE: 10.5, FAMILY: 11.5, EXTENDED_FAMILY: 10.5 },
        dependents: { CHILD: 9.5 }
      },
      {
        label: "65 - 74",
        minAge: 65,
        maxAge: 74,
        options: { SINGLE: 8, MEMBER_SPOUSE: 23.5, FAMILY: 0, EXTENDED_FAMILY: 11.5 },
        dependents: { CHILD: 0 }
      },
      {
        label: "75 - 84",
        minAge: 75,
        maxAge: 84,
        options: { SINGLE: 8.5, MEMBER_SPOUSE: 47, FAMILY: 0, EXTENDED_FAMILY: 12 },
        dependents: { CHILD: 0 }
      }
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
            const plansFromDb = data.plans || {};
            const finalPlans = { ...DEFAULT_PLANS } as any;
            
            // Migrate/Merge logic: Only use DB plan if it has the new tiered structure
            Object.keys(plansFromDb).forEach(key => {
                if (plansFromDb[key] && plansFromDb[key].ageTiers) {
                    finalPlans[key] = plansFromDb[key];
                }
            });

            setPlans(finalPlans);
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
                        {users.filter(u => ["ADMIN", "DIRECTOR", "GENERAL_MANAGER"].includes(u.role)).map(u => (
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
                  {["BASIC", "BRONZE", "SILVER", "GOLD"].map((planKey) => {
                    const planConfig = plans[planKey];
                    if (!planConfig) return null;
                    return (
                      <div key={planKey} className="border rounded-lg p-6 bg-gray-50 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className={PLAN_COLORS[planKey]}>{planKey}</Badge>
                            <h3 className="text-xl font-bold text-gray-900">{planConfig.name}</h3>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-medium text-gray-500">Cash Benefit</p>
                             <Input 
                                type="number" 
                                className="w-32 text-right font-bold"
                                value={planConfig.cashBenefit} 
                                onChange={(e) => setPlans({...plans, [planKey]: {...planConfig, cashBenefit: Number(e.target.value)}})} 
                             />
                          </div>
                        </div>

                        <div className="grid gap-6">
                          {planConfig.ageTiers?.map((tier: any, tierIdx: number) => (
                            <div key={tierIdx} className="bg-white rounded-lg border p-4 space-y-4 shadow-sm">
                              <div className="flex items-center justify-between border-b pb-2">
                                <h4 className="font-bold text-purple-700">{tier.label} Age Group</h4>
                                <div className="flex gap-2 text-xs text-gray-500">
                                  <span>Min: {tier.minAge}</span>
                                  <span>Max: {tier.maxAge}</span>
                                </div>
                              </div>
                              
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {tier.options && Object.keys(tier.options).map((optKey) => (
                                  <div key={optKey} className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">{optKey.replace('_', ' ')}</label>
                                    <Input 
                                      type="number"
                                      value={tier.options[optKey]}
                                      onChange={(e) => {
                                        const newTiers = [...planConfig.ageTiers];
                                        newTiers[tierIdx].options[optKey] = Number(e.target.value);
                                        setPlans({...plans, [planKey]: {...planConfig, ageTiers: newTiers}});
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>

                              <div className="pt-2 flex items-center gap-4 border-t">
                                <div className="flex-1">
                                  <label className="text-xs font-semibold text-gray-500 uppercase">Child Premium (Added Dependent)</label>
                                  <Input 
                                    type="number"
                                    value={tier.dependents?.CHILD}
                                    onChange={(e) => {
                                      const newTiers = [...planConfig.ageTiers];
                                      newTiers[tierIdx].dependents.CHILD = Number(e.target.value);
                                      setPlans({...plans, [planKey]: {...planConfig, ageTiers: newTiers}});
                                    }}
                                  />
                                </div>
                                {tier.dependents?.EXTENDED !== undefined && (
                                  <div className="flex-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Extended Premium (Added Dependent)</label>
                                    <Input 
                                      type="number"
                                      value={tier.dependents.EXTENDED}
                                      onChange={(e) => {
                                        const newTiers = [...planConfig.ageTiers];
                                        newTiers[tierIdx].dependents.EXTENDED = Number(e.target.value);
                                        setPlans({...plans, [planKey]: {...planConfig, ageTiers: newTiers}});
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">Policy Benefits (One per line)</label>
                          <textarea 
                            className="w-full min-h-[100px] rounded-md border border-gray-300 p-3 text-sm"
                            value={planConfig.benefits?.join('\n') || ''}
                            onChange={(e) => {
                              setPlans({...plans, [planKey]: {...planConfig, benefits: e.target.value.split('\n')}});
                            }}
                          />
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
