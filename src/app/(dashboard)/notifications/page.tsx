"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  FileText,
  Users,
} from "lucide-react";
import Link from "next/link";

// Dynamic Notifications mapped to UI needs

const priorityColors: Record<string, string> = {
  HIGH: "bg-red-100 text-red-800",
  NORMAL: "bg-blue-100 text-blue-800",
  LOW: "bg-gray-100 text-gray-800",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (e) {
        console.error("Error fetching notifications", e);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingApprovalsCount = notifications.filter((n) => n.type === "PENDING_APPROVAL").length;
  const urgentCount = notifications.filter((n) => n.priority === "HIGH").length;
  const todayCount = notifications.filter((n) => new Date(n.time).toDateString() === new Date().toDateString()).length;

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500">
            You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Mark All as Read</Button>
          <Button variant="outline">Settings</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unread</p>
                <p className="text-2xl font-bold text-purple-600">{unreadCount}</p>
              </div>
              <Bell className="h-8 w-8 text-purple-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Approvals</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingApprovalsCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Urgent</p>
                <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today</p>
                <p className="text-2xl font-bold text-gray-900">{todayCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.length === 0 ? <p className="text-gray-500 text-sm">No new notifications.</p> : null}
            {notifications.map((notification) => {
              let Icon = Bell;
              if (notification.type === "PENDING_APPROVAL") Icon = FileText;
              else if (notification.type === "CLAIM_UPDATE") Icon = CheckCircle;
              else if (notification.type === "PAYMENT_DUE") Icon = CreditCard;
              else if (notification.type === "RENEWAL_REMINDER") Icon = Clock;
              else if (notification.type === "WAITING_PERIOD_END") Icon = Users;

              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${notification.read
                      ? "bg-white border-gray-200"
                      : "bg-purple-50 border-purple-200"
                    }`}
                >
                  <div
                    className={`rounded-full p-2 ${notification.read ? "bg-gray-100" : "bg-purple-100"
                      }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${notification.read ? "text-gray-500" : "text-purple-600"
                        }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`font-medium ${notification.read ? "text-gray-700" : "text-gray-900"
                          }`}
                      >
                        {notification.title}
                      </p>
                      <Badge className={priorityColors[notification.priority]}>
                        {notification.priority}
                      </Badge>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-purple-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(notification.time).toLocaleString()}</p>
                  </div>
                  {notification.link && (
                    <Link href={notification.link}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
