"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Printer, FileText, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { SignatureSelector } from "@/components/SignatureSelector";
import { useAuth } from "@/hooks/useAuth";

export default function PolicyGenerationPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [policy, setPolicy] = useState<any>(null);
    const [adminSignature, setAdminSignature] = useState<string | null>(null);
    const [clientSignature, setClientSignature] = useState<string | null>(null);

    // Form fields for missing details / overrides
    const [formData, setFormData] = useState({
        policyNumber: "",
        inceptionDate: "",
        planType: "",
        premiumAmount: "",
        address: "",
        idNumber: "",
    });

    const getCoverDate = (dateStr: string) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        d.setMonth(d.getMonth() + 3);
        return formatDate(d.toISOString());
    };
    
    const getPaidUpDate = (dateStr: string) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        d.setFullYear(d.getFullYear() + 20);
        return formatDate(d.toISOString());
    };

    useEffect(() => {
        if (currentUser?.signature) {
            setAdminSignature(currentUser.signature);
        }
    }, [currentUser]);

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const res = await fetch(`/api/clients/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setClient(data.client);
                    
                    // Prefill with the earliest active policy
                    if (data.client.policies && data.client.policies.length > 0) {
                        const firstPolicy = [...data.client.policies].sort((a, b) =>
                            new Date(a.inceptionDate || a.createdAt).getTime() - new Date(b.inceptionDate || b.createdAt).getTime()
                        )[0];
                        setPolicy(firstPolicy);
                        setFormData({
                            policyNumber: firstPolicy.policyNumber || "",
                            inceptionDate: firstPolicy.inceptionDate ? firstPolicy.inceptionDate.substring(0, 10) : "",
                            planType: firstPolicy.planType || "",
                            premiumAmount: firstPolicy.premiumAmount ? firstPolicy.premiumAmount.toString() : "",
                            address: (data.client.street || "") + (data.client.city ? ", " + data.client.city : ""),
                            idNumber: data.client.idNumber || "",
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to load client:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClient();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
    if (!client) return <div className="p-8 text-center text-red-500">Client not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 md:p-8 print:p-0 print:bg-white">
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Print Hidden Actions */}
                <div className="flex items-center justify-between print:hidden mb-6">
                    <Link href={`/clients/${id}`}>
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Back to Client
                        </Button>
                    </Link>
                    <Button onClick={handlePrint} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                        <Printer className="h-4 w-4" /> Print Documents
                    </Button>
                </div>

                {/* Form to prefill details - Hidden on Print */}
                <Card className="print:hidden mb-8 border-blue-200">
                    <CardHeader className="bg-blue-50/50 border-b border-blue-100">
                        <CardTitle className="text-blue-900 flex items-center gap-2">
                            <FileText className="w-5 h-5" /> Let's Complete the Policy Details
                        </CardTitle>
                        <CardDescription>
                            Review and fill in any missing information before printing the policy document.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Policy Number</Label>
                                <Input 
                                    value={formData.policyNumber} 
                                    onChange={(e) => setFormData({...formData, policyNumber: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Inception Date</Label>
                                <Input 
                                    type="date"
                                    value={formData.inceptionDate} 
                                    onChange={(e) => setFormData({...formData, inceptionDate: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Plan Type</Label>
                                <Input 
                                    value={formData.planType} 
                                    onChange={(e) => setFormData({...formData, planType: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Client ID Number</Label>
                                <Input 
                                    value={formData.idNumber} 
                                    onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Address</Label>
                                <Input 
                                    value={formData.address} 
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Premium Amount</Label>
                                <Input 
                                    value={formData.premiumAmount} 
                                    onChange={(e) => setFormData({...formData, premiumAmount: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 border-t pt-8">
                            <SignatureSelector 
                                label="Administrator Signature" 
                                onSignatureChange={setAdminSignature} 
                            />
                            <SignatureSelector 
                                label="Client Signature" 
                                onSignatureChange={setClientSignature} 
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* --- PRINTABLE DOCUMENTS --- */}
                
                {/* 1. Acceptance Letter */}
                <div className="bg-white p-8 md:p-16 print:p-0 page-break-after relative min-h-[1050px] flex flex-col">
                    <div className="flex justify-between items-start mb-12">
                        <div className="flex items-center gap-3">
                            <img src="/images/logo.png" alt="Royalty Logo" className="h-14 w-auto object-contain" />
                        </div>
                        <div className="text-right text-xs text-gray-500">
                            <p>Stand 15383 Khami Road</p>
                            <p>Kelvin North, Bulawayo</p>
                            <p>Zimbabwe</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <p>{client.title} {client.firstName} {client.lastName}</p>
                        <p className="whitespace-pre-wrap">{formData.address}</p>
                    </div>

                    <p className="mb-6"><strong>Ref: LETTER OF ACCEPTANCE OF FUNERAL POLICY APPLICATION</strong></p>

                    <p className="mb-4 text-justify">
                        We would like to take this opportunity to inform you that your application for the funeral service cover was successful. Your policy number is <strong>{formData.policyNumber}</strong>. Please examine the document carefully and let us know of any error or omission and arrangements will be done to get the same rectified. You have the right to review your Policy within 30 days of the date of this letter. Should you wish to exercise this option please write to Royalty Funeral Services Suite 309 Sterling House, between L. Takawira and 8th Avenue along J. Moyo Street Bulawayo.
                    </p>

                    <p className="mb-8 text-justify">
                        The Policy Document and attached Policy terms and conditions are important contractual documents. We trust you will keep them in a secure place.
                    </p>

                    <p className="mb-8">
                        Yours faithfully,<br /><br />
                        {adminSignature ? (
                            <img src={adminSignature} alt="Admin Signature" className="h-16 object-contain mb-2" />
                        ) : (
                            <div className="h-16 w-48 border-b border-gray-300 mb-2"></div>
                        )}
                        <strong>The Administrator</strong>
                    </p>

                    <div className="mt-auto pt-12 text-center border-t border-gray-100 hidden print:block">
                        <p className="text-blue-900 font-bold text-sm tracking-widest">ROYALTY FUNERAL SERVICES – A DIGNIFIED SEND-OFF</p>
                    </div>
                </div>

                {/* 2. Policy Holder Details */}
                <div className="bg-white p-8 md:p-16 print:p-0 page-break-before relative min-h-[1050px] flex flex-col">
                    <div className="flex justify-between items-start mb-12">
                        <div className="flex items-center gap-3">
                            <img src="/images/logo.png" alt="Royalty Logo" className="h-14 w-auto object-contain" />
                        </div>
                        <div className="text-right text-xs text-gray-500">
                            <p>Stand 15383 Khami Road</p>
                            <p>Kelvin North, Bulawayo</p>
                            <p>Zimbabwe</p>
                        </div>
                    </div>

                    <h2 className="text-xl font-bold uppercase mb-4 underline">Policy Holder Details</h2>
                    
                    <table className="w-full text-sm border-collapse border border-gray-900 mb-8">
                        <tbody>
                            <tr className="border-b border-gray-900"><td className="p-2 border-r border-gray-900 font-bold w-1/3">Policy number:</td><td className="p-2">{formData.policyNumber}</td></tr>
                            <tr className="border-b border-gray-900"><td className="p-2 border-r border-gray-900 font-bold">Full Name:</td><td className="p-2">{client.title} {client.firstName} {client.lastName}</td></tr>
                            <tr className="border-b border-gray-900"><td className="p-2 border-r border-gray-900 font-bold">Date of Birth:</td><td className="p-2">{formatDate(client.dateOfBirth)}</td></tr>
                            <tr className="border-b border-gray-900"><td className="p-2 border-r border-gray-900 font-bold">ID Number:</td><td className="p-2">{formData.idNumber}</td></tr>
                            <tr className="border-b border-gray-900"><td className="p-2 border-r border-gray-900 font-bold">Contact Number:</td><td className="p-2">{client.phone}</td></tr>
                            <tr className="border-b border-gray-900"><td className="p-2 border-r border-gray-900 font-bold">Address:</td><td className="p-2 whitespace-pre-wrap">{formData.address}</td></tr>
                            <tr className="border-b border-gray-900"><td className="p-2 border-r border-gray-900 font-bold">Premium:</td><td className="p-2">${formData.premiumAmount} USD</td></tr>
                            <tr className="border-b border-gray-900"><td className="p-2 border-r border-gray-900 font-bold">Plan Level:</td><td className="p-2">{formData.planType}</td></tr>
                            <tr className="border-b border-gray-900"><td className="p-2 border-r border-gray-900 font-bold">Premium Mode:</td><td className="p-2">Monthly</td></tr>
                            <tr className="border-b border-gray-900"><td className="p-2 border-r border-gray-900 font-bold">Review Date:</td><td className="p-2">Annually, automatically</td></tr>
                            <tr className="border-b border-gray-900"><td className="p-2 border-r border-gray-900 font-bold">Commencement Date:</td><td className="p-2">{formData.inceptionDate ? formatDate(formData.inceptionDate) : ""}</td></tr>
                            <tr className="border-b border-gray-900"><td className="p-2 border-r border-gray-900 font-bold">Cover Date:</td><td className="p-2">{getCoverDate(formData.inceptionDate)}</td></tr>
                            <tr className="border-b border-gray-900"><td className="p-2 border-r border-gray-900 font-bold">Term of Contract:</td><td className="p-2">20 years</td></tr>
                            <tr className="border-b border-gray-900"><td className="p-2 border-r border-gray-900 font-bold">Paid up date:</td><td className="p-2">{getPaidUpDate(formData.inceptionDate)}</td></tr>
                            <tr><td className="p-2 border-r border-gray-900 font-bold">Financial Advisor:</td><td className="p-2">B. Sibanda</td></tr>
                        </tbody>
                    </table>

                    {/* Dependents Table */}
                    {policy?.dependents && Object.keys(policy.dependents).length > 0 && (
                        <div className="mb-8">
                            <h3 className="font-bold uppercase mb-2">Dependents</h3>
                            <table className="w-full text-sm border-collapse border border-gray-900">
                                <thead>
                                    <tr className="border-b border-gray-900">
                                        <th className="p-2 text-left border-r border-gray-900">Full Name</th>
                                        <th className="p-2 text-left border-r border-gray-900">ID Number</th>
                                        <th className="p-2 text-left border-r border-gray-900">Relationship</th>
                                        <th className="p-2 text-left">Premium</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.values(policy.dependents).map((dep: any, idx) => (
                                        <tr key={idx} className="border-b border-gray-900 last:border-0">
                                            <td className="p-2 border-r border-gray-900">{dep.firstName} {dep.lastName}</td>
                                            <td className="p-2 border-r border-gray-900">{dep.idNumber}</td>
                                            <td className="p-2 border-r border-gray-900">{dep.relationship}</td>
                                            <td className="p-2">${dep.premium || "0.00"} USD</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Beneficiaries Table */}
                    {policy?.beneficiaries && Object.keys(policy.beneficiaries).length > 0 && (
                        <div className="mb-8">
                            <h3 className="font-bold uppercase mb-2">Beneficiaries</h3>
                            <table className="w-full text-sm border-collapse border border-gray-900">
                                <thead>
                                    <tr className="border-b border-gray-900">
                                        <th className="p-2 text-left border-r border-gray-900">Full Name</th>
                                        <th className="p-2 text-left border-r border-gray-900">ID Number</th>
                                        <th className="p-2 text-left border-r border-gray-900">Relationship</th>
                                        <th className="p-2 text-left">Contact</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.values(policy.beneficiaries).map((ben: any, idx) => (
                                        <tr key={idx} className="border-b border-gray-900 last:border-0">
                                            <td className="p-2 border-r border-gray-900">{ben.firstName} {ben.lastName}</td>
                                            <td className="p-2 border-r border-gray-900">{ben.idNumber}</td>
                                            <td className="p-2 border-r border-gray-900">{ben.relationship}</td>
                                            <td className="p-2">{ben.phone}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    
                    {/* BENEFITS UPON DEATH */}
                    <div className="mb-8">
                        <h3 className="font-bold uppercase mb-2 underline">BENEFITS UPON DEATH:</h3>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>Flat-Lid Casket</li>
                            <li>Standard funeral services that includes; Mortuary services, Hearse, Body removal, Washing and Dressing, Body preservation, Gravesite equipment, Chairs, Tents, Lowering machines.</li>
                            <li>US$150.00 OR equivalent worth of grocery hampers.</li>
                            <li>US$15.00 worth of airtime.</li>
                            <li>Transport for mourners.</li>
                        </ul>
                    </div>

                    <div className="mt-12 flex justify-between items-end px-4 border-t pt-8">
                        <div className="text-center">
                            {adminSignature ? (
                                <img src={adminSignature} alt="Admin Signature" className="h-12 object-contain mb-1 mx-auto" />
                            ) : (
                                <div className="h-12 w-40 border-b border-gray-400 mb-1 mx-auto"></div>
                            )}
                            <p className="text-xs font-bold">The Administrator</p>
                        </div>
                        <div className="text-center">
                            {clientSignature ? (
                                <img src={clientSignature} alt="Client Signature" className="h-12 object-contain mb-1 mx-auto" />
                            ) : (
                                <div className="h-12 w-40 border-b border-gray-400 mb-1 mx-auto"></div>
                            )}
                            <p className="text-xs font-bold">Client / Policyholder</p>
                        </div>
                    </div>

                    <div className="mt-auto pt-12 text-center border-t border-gray-100 hidden print:block">
                        <p className="text-blue-900 font-bold text-sm tracking-widest">ROYALTY FUNERAL SERVICES – A DIGNIFIED SEND-OFF</p>
                    </div>
                </div>

                {/* 3. Terms and Conditions */}
                <div className="bg-white p-8 md:p-16 print:p-0 page-break-before space-y-4 text-justify text-xs leading-relaxed relative min-h-[1050px] flex flex-col">
                    <div className="flex justify-between items-start mb-8 border-b pb-4">
                        <div className="flex items-center gap-3">
                            <img src="/images/logo.png" alt="Royalty Logo" className="h-12 w-auto object-contain" />
                        </div>
                        <div className="text-right text-[10px] font-bold text-blue-900 uppercase">
                            Terms & Conditions
                        </div>
                    </div>

                    <h2 className="text-center text-xl font-black uppercase mb-8 underline tracking-tight">Terms & Conditions</h2>

                    <h3 className="font-bold underline text-sm">1. Benefits Payable</h3>
                    <p>Funeral cover for the Principal Life is stated in the attached policy schedule. The benefit entitlement of each co-life is stated in the proposal form.</p>
                    <p>Benefits payable and services to be provided in the event of death shall be as follows:</p>
                    <ul className="list-disc pl-5">
                        <li>Grocery allowance</li>
                        <li>Provision of Standard funeral services</li>
                        <li>Transport for mourners</li>
                        <li>Chapel services</li>
                        <li>Funeral cover for a maximum of 5 children ceases upon attainment of age 21 after which they are charged the dependent rate</li>
                    </ul>

                    <h3 className="font-bold underline text-sm mt-4">2.Waiting period</h3>
                    <p>No services will be provided and benefits will be paid if death occurs within the waiting period save for the accidental death</p>
                    <ul className="list-disc pl-5">
                        <li>3 months from the date of commencement of this policy.</li>
                        <li>1 month from the date of reinstatement from a lapse state within 3 months of lapse</li>
                        <li>3 months from the date of reinstatement from a lapse state between 3 to 6 months of lapse</li>
                        <li>3 months from the date of inclusion of a new member for that particular member.</li>
                    </ul>

                    <h3 className="font-bold underline text-sm mt-4">3. Accidental death shall mean death, during the currency of this policy, caused by Road-Traffic Accidents ONLY.</h3>

                    <h3 className="font-bold underline text-sm mt-4">4.Claim intimation</h3>
                    <p>Upon death of a covered member, a properly completed claimant's certificate together with proof of death including but not limited to the following must be forwarded to the company with 3 months of death:</p>
                    <ul className="list-disc pl-5">
                        <li>Original burial order or death certificate.</li>
                        <li>Original police report (in the case of accidental death)</li>
                    </ul>

                    <h3 className="font-bold underline text-sm mt-4">5.Policy exclusions</h3>
                    <p>This policy excludes all claims arising:</p>
                    <ul className="list-disc pl-5">
                        <li>As a consequence of war, invasion, act of foreign enemy, hostilities or war like operations (whether war has been declared or not), mutiny siege, riot civil war commotion, rebellion, instructions and conspiracy.</li>
                        <li>As a result of suicide, whether sane or Insane, during the first 24 (twenty-four), calendar months from the date of commencement or reinstatement of this policy.</li>
                    </ul>

                    {/* Sections 6 and 7 in user's prompt are exact duplicates of 4 and 5, so we skip to 8 */}

                    <h3 className="font-bold underline text-sm mt-4">8.Lapse</h3>
                    <p>In the event of non-payment of premiums within the grace period at any time during the currency of this policy, the policy shall lapse all premiums paid shall be forfeited to the company and all benefits will be lost.</p>

                    <h3 className="font-bold underline text-sm mt-4">9.Reinstatement</h3>
                    <p>Should this policy lapse, It may be reinstated on written request, on such terms as may be fixed by the company from time to time. Such reinstatement shall be allowable within 12 (twelve) months from the date of lapse.</p>

                    <h3 className="font-bold underline text-sm mt-4">10.Voluntary cancellation policy</h3>
                    <p>Voluntary cancellation of this policy is a breach of contract. All premiums paid shall be forfeited to the company. A voluntarily cancelled policy cannot be reinstated.</p>

                    <h3 className="font-bold underline text-sm mt-4">11.Payments</h3>
                    <p>All payments to and by the company shall be made at any ROYALTY FUNERAL SERVICES office or representative in the legal tender and may be reviewed in line with the cost of service provision at the discretion of the company from time to time.</p>

                    <h3 className="font-bold underline text-sm mt-4">12.Waiver and amendment of policy terms and conditions</h3>
                    <p>No variation, amendment, change or waiver of the terms and conditions of this policy in a manner whatsoever shall be binding on the company unless reduced to writing under the signature of a duly authorized officer to the company.</p>

                    <h3 className="font-bold underline text-sm mt-4">13.Riders</h3>
                    <p>Payment for Policy riders should be included in the monthly premium. Riders only cover the Principal member (Policy-holder) and their spouses where applicable.</p>
                    
                    <div className="mt-auto pt-8 text-center border-t border-gray-100 hidden print:block">
                        <p className="text-blue-900 font-bold text-xs tracking-widest">ROYALTY FUNERAL SERVICES – A DIGNIFIED SEND-OFF</p>
                    </div>
                </div>

            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    body {
                        margin: 1.6cm;
                        background-color: white !important;
                    }
                    .page-break-after {
                        page-break-after: always;
                    }
                    .page-break-before {
                        page-break-before: always;
                    }
                    /* Hide browser header and footer */
                    header, footer, .no-print {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
