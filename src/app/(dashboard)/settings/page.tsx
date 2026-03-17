"use client";

import { useState } from "react";
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
import { Building2, Save, Shield, Bell, FileText, CreditCard } from "lucide-react";

const planConfigs = [
  {
    plan: "WHITE",
    name: "White Plan",
    basePremium: 150,
    cover: 15000,
    spousePremium: 75,
    childPremium: 35,
    parentPremium: 60,
  },
  {
    plan: "GOLD",
    name: "Gold Plan",
    basePremium: 250,
    cover: 25000,
    spousePremium: 100,
    childPremium: 50,
    parentPremium: 80,
  },
  {
    plan: "BLUE",
    name: "Blue Plan",
    basePremium: 350,
    cover: 35000,
    spousePremium: 125,
    childPremium: 65,
    parentPremium: 100,
  },
  {
    plan: "PURPLE",
    name: "Purple Plan",
    basePremium: 500,
    cover: 50000,
    spousePremium: 175,
    childPremium: 85,
    parentPremium: 140,
  },
];

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("Royalty Funeral Services");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage system configuration and preferences</p>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="plans">Plan Configuration</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                Company Information
              </CardTitle>
              <CardDescription>Basic company details and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
                <Input
                  label="Registration Number"
                  defaultValue="2020/123456/07"
                />
                <Input
                  label="VAT Number"
                  defaultValue="4123456789"
                />
                <Input
                  label="Contact Phone"
                  defaultValue="011 123 4567"
                />
                <Input
                  label="Contact Email"
                  defaultValue="info@royaltyfuneral.co.za"
                />
                <Input
                  label="Website"
                  defaultValue="www.royaltyfuneral.co.za"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Physical Address"
                  defaultValue="123 Main Road, Johannesburg"
                />
                <Input
                  label="Postal Address"
                  defaultValue="P.O. Box 1234, Johannesburg, 2000"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} loading={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Funeral Plan Configuration
              </CardTitle>
              <CardDescription>Configure plan premiums and cover amounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {planConfigs.map((config) => (
                  <div key={config.plan} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            config.plan === "WHITE"
                              ? "white"
                              : config.plan === "GOLD"
                              ? "gold"
                              : config.plan === "BLUE"
                              ? "blue"
                              : "purple"
                          }
                        >
                          {config.plan}
                        </Badge>
                        <span className="font-semibold">{config.name}</span>
                      </div>
                      <span className="text-lg font-bold text-purple-600">
                        {formatCurrency(config.basePremium)}/month
                      </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                      <Input
                        label="Principal Cover"
                        type="number"
                        defaultValue={config.cover}
                      />
                      <Input
                        label="Base Premium"
                        type="number"
                        defaultValue={config.basePremium}
                      />
                      <Input
                        label="Spouse Premium"
                        type="number"
                        defaultValue={config.spousePremium}
                      />
                      <Input
                        label="Child Premium"
                        type="number"
                        defaultValue={config.childPremium}
                      />
                      <Input
                        label="Parent Premium"
                        type="number"
                        defaultValue={config.parentPremium}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={handleSave} loading={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Plan Configuration
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Waiting Periods</CardTitle>
              <CardDescription>Configure claim waiting periods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="Natural Death (months)"
                  type="number"
                  defaultValue={6}
                />
                <Input
                  label="Accidental Death (months)"
                  type="number"
                  defaultValue={0}
                />
                <Input
                  label="New Dependent (months)"
                  type="number"
                  defaultValue={6}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                Payment Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Grace Period (days)"
                  type="number"
                  defaultValue={30}
                  helperText="Days before policy lapses due to non-payment"
                />
                <Input
                  label="Renewal Reminder (days)"
                  type="number"
                  defaultValue={7}
                  helperText="Days before renewal to send reminder"
                />
                <Select defaultValue="monthly">
                  <SelectTrigger label="Default Payment Frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="debit_order">
                  <SelectTrigger label="Preferred Payment Method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit_order">Debit Order</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="eft">EFT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval Workflow</CardTitle>
              <CardDescription>Configure approval requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Select defaultValue="required">
                  <SelectTrigger label="Proposal Approval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-approve</SelectItem>
                    <SelectItem value="required">Manager Approval Required</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="required">
                  <SelectTrigger label="Alteration Approval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-approve</SelectItem>
                    <SelectItem value="required">Manager Approval Required</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="required">
                  <SelectTrigger label="Claim Approval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claims_officer">Claims Officer</SelectItem>
                    <SelectItem value="required">Manager Approval Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-600" />
                Notification Settings
              </CardTitle>
              <CardDescription>Configure when and how notifications are sent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "Payment Reminders", description: "Notify clients about upcoming payments" },
                  { label: "Policy Renewals", description: "Alert about policy renewal dates" },
                  { label: "Claim Updates", description: "Notify about claim status changes" },
                  { label: "Approval Requests", description: "Alert managers about pending approvals" },
                  { label: "Waiting Period Completion", description: "Notify when waiting period ends" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="success">Email</Badge>
                      <Badge variant="secondary">SMS</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Session Timeout (minutes)"
                  type="number"
                  defaultValue={30}
                />
                <Input
                  label="Password Expiry (days)"
                  type="number"
                  defaultValue={90}
                />
                <Input
                  label="Max Login Attempts"
                  type="number"
                  defaultValue={5}
                />
                <Input
                  label="Lockout Duration (minutes)"
                  type="number"
                  defaultValue={15}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backup & Recovery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Last Backup</p>
                  <p className="text-sm text-gray-500">12 February 2026, 03:00 AM</p>
                </div>
                <Button variant="outline">Backup Now</Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select defaultValue="daily">
                  <SelectTrigger label="Backup Frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  label="Retention Period (days)"
                  type="number"
                  defaultValue={30}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
