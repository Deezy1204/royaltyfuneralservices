"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Phone, Shield, Key, Save, AlertCircle, CheckCircle } from "lucide-react";
import { getInitials, formatDateTime } from "@/lib/utils";

const ROLE_COLORS: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-800",
    GENERAL_MANAGER: "bg-purple-100 text-purple-800",
    MANAGER: "bg-purple-100 text-purple-800",
    AGENT: "bg-blue-100 text-blue-800",
    ACCOUNTS: "bg-green-100 text-green-800",
    CLAIMS_OFFICER: "bg-orange-100 text-orange-800",
};

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/auth/me");
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                    setForm({ firstName: data.user.firstName || "", lastName: data.user.lastName || "", phone: data.user.phone || "" });
                }
            } catch {
                setMessage({ type: "error", text: "Failed to load profile" });
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: "", text: "" });
        try {
            const res = await fetch("/api/auth/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                setMessage({ type: "success", text: "Profile updated successfully" });
                const data = await res.json();
                setUser((prev: any) => ({ ...prev, ...data.user }));
            } else {
                const data = await res.json();
                setMessage({ type: "error", text: data.error || "Failed to update profile" });
            }
        } catch {
            setMessage({ type: "error", text: "Failed to update profile" });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match" });
            return;
        }
        setSaving(true);
        setMessage({ type: "", text: "" });
        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
            });
            if (res.ok) {
                setMessage({ type: "success", text: "Password changed successfully" });
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                const data = await res.json();
                setMessage({ type: "error", text: data.error || "Failed to change password" });
            }
        } catch {
            setMessage({ type: "error", text: "Failed to change password" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto pb-10">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-500">View and update your account details</p>
            </div>

            {message.text && (
                <div className={`flex items-center gap-2 rounded-lg p-4 text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                    {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {message.text}
                </div>
            )}

            {/* Profile Overview */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="text-xl bg-purple-100 text-purple-700">
                                {user ? getInitials(user.firstName, user.lastName) : "?"}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">{user?.firstName} {user?.lastName}</h2>
                            <p className="text-gray-500 flex items-center gap-1"><Mail className="h-3 w-3" />{user?.email}</p>
                            <div className="mt-1 flex gap-2">
                                <Badge className={ROLE_COLORS[user?.role] || "bg-gray-100 text-gray-800"}>{user?.role}</Badge>
                                {user?.lastLogin && (
                                    <span className="text-xs text-gray-400">Last login: {formatDateTime(user.lastLogin)}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Profile */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-4 w-4 text-purple-600" />Edit Profile
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleProfileSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="First Name" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} required />
                            <Input label="Last Name" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                <Mail className="h-3 w-3" />Email Address
                            </label>
                            <Input value={user?.email || ""} disabled className="bg-gray-50 text-gray-400 cursor-not-allowed" />
                            <p className="text-xs text-gray-400">Email cannot be changed. Contact Administrator.</p>
                        </div>
                        <Input label="Phone Number" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={saving}>
                                <Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Key className="h-4 w-4 text-orange-600" />Change Password
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <Input label="Current Password" type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} required />
                        <Input label="New Password" type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} required />
                        <Input label="Confirm New Password" type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={saving}>
                                <Key className="mr-2 h-4 w-4" />{saving ? "Changing..." : "Change Password"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Role & Permissions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Shield className="h-4 w-4 text-gray-600" />Role & Permissions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <Badge className={`${ROLE_COLORS[user?.role]} text-sm px-3 py-1`}>{user?.role}</Badge>
                        <p className="text-sm text-gray-500">
                            {["ADMIN", "GENERAL_MANAGER", "DIRECTOR"].includes(user?.role) && "Full access to all features including user management and approvals."}
                            {user?.role === "MANAGER" && "Access to manage teams, approve proposals, and view all reports."}
                            {user?.role === "AGENT" && "Access to create and manage clients, proposals, and claims."}
                            {user?.role === "ACCOUNTS" && "Access to manage payments and financial records."}
                            {user?.role === "CLAIMS_OFFICER" && "Access to manage and process claims."}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
