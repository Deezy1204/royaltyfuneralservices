"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await resetPassword(email);
      setMessage("Password reset email sent! Please check your inbox.");
      setEmail("");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto">
            <Image
              src="/images/logo.png"
              alt="Royalty Funeral Services"
              width={100}
              height={100}
              className="object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Forgot Password?
            </CardTitle>
            <CardDescription className="text-gray-500">
              Enter your email to receive a password reset link
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
                {message}
              </div>
            )}
            <Input
              label="Email Address"
              type="email"
              placeholder="admin@royaltyfuneral.co.za"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" loading={loading}>
              Send Reset Link
            </Button>
          </form>
          
          <div className="text-center">
            <Link 
              href="/login" 
              className="text-sm font-medium text-purple-600 hover:text-purple-500"
            >
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
