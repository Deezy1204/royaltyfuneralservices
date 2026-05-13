"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  BookOpen, 
  ChevronRight, 
  ChevronDown, 
  Users, 
  FileText, 
  ShieldCheck, 
  CreditCard, 
  Settings, 
  BarChart3,
  HelpCircle,
  PlayCircle,
  ArrowRight,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  subsections: {
    id: string;
    title: string;
    icon?: React.ReactNode;
    content: React.ReactNode;
  }[];
}

export default function SystemDocumentationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>(["getting-started"]);
  const [activeSubsection, setActiveSubsection] = useState("login");

  const sections: DocSection[] = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: <PlayCircle className="w-4 h-4" />,
      subsections: [
        {
          id: "login",
          title: "Accessing the System",
          content: (
            <div className="space-y-4">
              <p>Welcome to the Royalty Funeral Services Admin Dashboard. To access the system, follow these steps:</p>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex gap-3">
                <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <p className="text-sm text-purple-900 italic">
                  Ensure you have received your official credentials from the System Administrator before attempting to log in.
                </p>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Navigate to the login portal URL.</li>
                <li>Enter your registered <strong>Email Address</strong>.</li>
                <li>Enter your <strong>Password</strong>.</li>
                <li>Click <strong>Login</strong> to access your personal dashboard.</li>
              </ol>
            </div>
          )
        },
        {
          id: "dashboard-overview",
          title: "Dashboard Overview",
          content: (
            <div className="space-y-4">
              <p>The dashboard provides a high-level summary of the system's current state. Key features include:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Key Metrics:</strong> Real-time count of total clients, active policies, and pending claims.</li>
                <li><strong>Quick Actions:</strong> Buttons to immediately add a new client or record a payment.</li>
                <li><strong>Recent Activity:</strong> A live feed of the latest actions taken within the system.</li>
              </ul>
            </div>
          )
        }
      ]
    },
    {
      id: "client-management",
      title: "Client Management",
      icon: <Users className="w-4 h-4" />,
      subsections: [
        {
          id: "adding-clients",
          title: "Adding a New Client",
          content: (
            <div className="space-y-4">
              <p>Adding a client is the first step in creating a policy. To add a client:</p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Click on <strong>Clients</strong> in the sidebar.</li>
                <li>Click the <strong>Add Client</strong> button at the top right.</li>
                <li>Fill in the required fields (Names, ID Number, Contact Details).</li>
                <li>Verify the ID Number is correct to avoid duplicate entries.</li>
                <li>Click <strong>Save Client</strong>.</li>
              </ol>
            </div>
          )
        },
        {
          id: "editing-clients",
          title: "Editing Client Details",
          content: (
            <div className="space-y-4">
              <p>You can update client information at any time if their circumstances change (e.g., new address or phone number).</p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Locate the client in the <strong>Clients</strong> list.</li>
                <li>Click the three dots (Options) and select <strong>Edit Details</strong>.</li>
                <li>Update the necessary information.</li>
                <li>Click <strong>Save Changes</strong>. The system will create an audit log of this change.</li>
              </ol>
            </div>
          )
        }
      ]
    },
    {
      id: "policy-management",
      title: "Policy & Plans",
      icon: <ShieldCheck className="w-4 h-4" />,
      subsections: [
        {
          id: "creating-policies",
          title: "Creating a Policy",
          content: (
            <div className="space-y-4">
              <p>Policies are attached to clients. A client must exist before a policy can be created.</p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Open the <strong>Client Detail</strong> page.</li>
                <li>Click on <strong>Add Policy</strong> (or Create Proposal).</li>
                <li>Select the <strong>Plan Type</strong> and <strong>Service Type</strong>.</li>
                <li>Add dependents and beneficiaries if applicable.</li>
                <li>Set the premium amount and frequency.</li>
              </ol>
            </div>
          )
        },
        {
          id: "alterations",
          title: "Policy Alterations",
          content: (
            <div className="space-y-4">
              <p>Alterations allow you to change an existing policy (e.g., Upgrade/Downgrade or adding a dependent).</p>
              <p className="text-gray-700 italic">Note: Alterations usually require approval from a Manager or Administrator before they take effect.</p>
            </div>
          )
        }
      ]
    },
    {
      id: "claims",
      title: "Claims Processing",
      icon: <FileText className="w-4 h-4" />,
      subsections: [
        {
          id: "lodging-claim",
          title: "Lodging a Claim",
          content: (
            <div className="space-y-4">
              <p>To record a death and lodge a claim:</p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Go to the <strong>Claims</strong> section.</li>
                <li>Click <strong>New Claim</strong>.</li>
                <li>Search for the Client or Policy Number.</li>
                <li>Fill in the details of the deceased and the cause of death.</li>
                <li>Submit for review.</li>
              </ol>
            </div>
          )
        },
        {
          id: "claim-approval",
          title: "Approval Workflow",
          content: (
            <div className="space-y-4">
              <p>Once a claim is submitted, it passes through several stages:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li><strong>Pending:</strong> Awaiting initial review.</li>
                <li><strong>Under Review:</strong> Verification of documents is in progress.</li>
                <li><strong>Approved:</strong> Claim is validated for payment.</li>
                <li><strong>Paid:</strong> Payment has been disbursed to the beneficiary.</li>
              </ul>
            </div>
          )
        }
      ]
    },
    {
      id: "payments",
      title: "Payments & Financials",
      icon: <CreditCard className="w-4 h-4" />,
      subsections: [
        {
          id: "recording-payment",
          title: "Recording Payments",
          content: (
            <div className="space-y-4">
              <p>To record a monthly premium payment:</p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Click <strong>New Payment</strong>.</li>
                <li>Select the client and policy.</li>
                <li>Enter the amount and payment method (Cash, EFT, Debit Order).</li>
                <li>The system will automatically calculate the months covered.</li>
                <li>Click <strong>Complete Payment</strong> to generate a receipt.</li>
              </ol>
            </div>
          )
        }
      ]
    },
    {
      id: "admin",
      title: "Administration",
      icon: <Settings className="w-4 h-4" />,
      subsections: [
        {
          id: "user-management",
          title: "User Roles & Permissions",
          content: (
            <div className="space-y-4">
              <p>The system supports multiple roles with different access levels:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Director:</strong> Full access to all system features and user management.</li>
                <li><strong>General Manager:</strong> Equivalent to Admin, handles high-level operations.</li>
                <li><strong>Admin:</strong> Manages clients, policies, and standard users.</li>
                <li><strong>Agent:</strong> Limited access to register clients and view their own portfolios.</li>
                <li><strong>Claims Officer:</strong> Focused on processing and approving claims.</li>
              </ul>
            </div>
          )
        },
        {
          id: "audit-logs",
          title: "Auditing & Security",
          icon: <BarChart3 className="w-4 h-4" />,
          content: (
            <div className="space-y-4">
              <p>Every critical action in the system (edits, deletions, approvals) is recorded in the <strong>Audit Logs</strong>. These logs include the timestamp, user responsible, and the "Before vs After" data comparison.</p>
            </div>
          )
        }
      ]
    }
  ];

  const toggleSection = (id: string) => {
    setExpandedSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const filteredSections = useMemo(() => {
    if (!searchQuery) return sections;
    
    return sections.map(section => ({
      ...section,
      subsections: section.subsections.filter(sub => 
        sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(section => section.subsections.length > 0);
  }, [searchQuery]);

  const activeContent = useMemo(() => {
    for (const section of sections) {
      const sub = section.subsections.find(s => s.id === activeSubsection);
      if (sub) return { sectionTitle: section.title, ...sub };
    }
    return null;
  }, [activeSubsection]);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gray-50/50 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100 space-y-4">
          <div className="flex items-center gap-2 text-purple-700 font-bold">
            <BookOpen className="w-5 h-5" />
            <span>Documentation</span>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search guides..." 
              className="pl-9 h-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            {filteredSections.map((section) => (
              <div key={section.id} className="space-y-1">
                <button
                  onClick={() => toggleSection(section.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-md text-sm font-medium transition-colors",
                    expandedSections.includes(section.id) ? "text-purple-700 bg-purple-50" : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {section.icon}
                    <span>{section.title}</span>
                  </div>
                  {expandedSections.includes(section.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                
                {expandedSections.includes(section.id) && (
                  <div className="ml-4 pl-2 border-l border-gray-100 space-y-1 py-1">
                    {section.subsections.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setActiveSubsection(sub.id)}
                        className={cn(
                          "w-full text-left p-2 rounded-md text-sm transition-colors",
                          activeSubsection === sub.id 
                            ? "bg-white text-purple-700 font-semibold shadow-sm border border-purple-100" 
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        {sub.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white">
        {activeContent && (
          <ScrollArea className="flex-1">
            <div className="max-w-3xl mx-auto py-12 px-8 space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-purple-600 text-xs font-bold uppercase tracking-wider">
                  <span>{activeContent.sectionTitle}</span>
                  <ChevronRight className="w-3 h-3" />
                  <span>{activeContent.title}</span>
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {activeContent.title}
                </h1>
              </div>

              <div className="prose prose-purple max-w-none text-gray-600 leading-relaxed">
                {activeContent.content}
              </div>

              {/* Placeholder for "Screenshots" using stylized UI cards */}
              <div className="mt-12 space-y-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                   <Info className="w-5 h-5 text-blue-500" />
                   Interface Preview
                </h3>
                <Card className="bg-gray-50 border-gray-200 overflow-hidden shadow-inner border-2 border-dashed">
                  <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-400">
                      <Search className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900">Visual Guide Coming Soon</p>
                      <p className="text-xs text-gray-500 max-w-xs mx-auto">
                        High-resolution screenshots of the dashboard interface will be added here to help you navigate visually.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Next Steps Footer */}
              <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
                <a 
                  href="mailto:support@royaltyfuneral.co.za" 
                  className="flex items-center gap-2 text-gray-400 hover:text-purple-600 transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Still need help? Contact support.</span>
                </a>
                
                {(() => {
                  // Find next subsection
                  const allSubsections = sections.flatMap(s => s.subsections);
                  const currentIndex = allSubsections.findIndex(s => s.id === activeSubsection);
                  const nextSub = allSubsections[currentIndex + 1];

                  if (!nextSub) return null;

                  return (
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        setActiveSubsection(nextSub.id);
                        // Also expand the parent section if it's not expanded
                        const parentSection = sections.find(s => s.subsections.some(sub => sub.id === nextSub.id));
                        if (parentSection && !expandedSections.includes(parentSection.id)) {
                          setExpandedSections(prev => [...prev, parentSection.id]);
                        }
                        // Scroll to top
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 group"
                    >
                      Next: {nextSub.title} <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  );
                })()}
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
