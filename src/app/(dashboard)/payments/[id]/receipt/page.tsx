
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, FileText, CheckCircle2, Share2, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import { formatDate, formatCurrency, numberToWords } from "@/lib/utils";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import html2canvas from "html2canvas";
import { ShareDocumentButton } from "@/components/ui/ShareDocumentButton";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function ReceiptPage() {
    const { id } = useParams();
    const { user: currentUser } = useAuth();
    const [payment, setPayment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [adminSignature, setAdminSignature] = useState<string | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [showProofModal, setShowProofModal] = useState(false);
    const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "DIRECTOR" || currentUser?.role === "SUPER_ADMIN";

    const receiptRef = useRef<HTMLDivElement>(null);

    const fetchPayment = async () => {
        try {
            const res = await fetch(`/api/payments/${id}`);
            if (res.ok) {
                const data = await res.json();
                setPayment(data.payment);
            } else {
                setError("Failed to load payment details");
            }
        } catch (err) {
            setError("An error occurred while fetching data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.signature) {
            setAdminSignature(currentUser.signature);
        }
    }, [currentUser]);

    useEffect(() => {
        if (id) fetchPayment();
    }, [id]);

    const handleConfirm = async () => {
        if (!confirm("Are you sure you want to confirm this payment? This will update the policy status and record the payment as official.")) return;
        
        setConfirming(true);
        try {
            const res = await fetch(`/api/payments/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "CONFIRMED" }),
            });

            if (res.ok) {
                toast.success("Payment confirmed successfully");
                fetchPayment();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to confirm payment");
            }
        } catch (err) {
            toast.error("An error occurred while confirming payment");
        } finally {
            setConfirming(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShareImage = async () => {
        if (!receiptRef.current) return;
        
        const toastId = toast.loading("Generating receipt image...");
        try {
            // Give a small delay to ensure everything is rendered
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2, // Higher quality
                useCORS: true, // For images like logo
                logging: false,
                backgroundColor: "#ffffff"
            });
            
            canvas.toBlob(async (blob) => {
                if (!blob) throw new Error("Canvas to Blob failed");
                const file = new File([blob], `receipt-${payment.receiptNumber}.png`, { type: 'image/png' });
                
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `Payment Receipt - ${payment.receiptNumber}`,
                        text: `Receipt for ${payment.client?.firstName} ${payment.client?.lastName}`
                    });
                    toast.success("Shared successfully", { id: toastId });
                } else {
                    // Fallback to download
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `receipt-${payment.receiptNumber}.png`;
                    link.click();
                    toast.success("Image saved to your device", { id: toastId });
                }
            }, 'image/png');
        } catch (err) {
            console.error("Error generating image:", err);
            toast.error("Failed to generate image", { id: toastId });
        }
    };

    const formattedText = payment ? `
*ROYALTY FUNERAL SERVICES*
*PAYMENT RECEIPT*

*Receipt No:* #${payment.receiptNumber}
*Date:* ${formatDate(payment.createdAt)}
*Client:* ${payment.client?.firstName} ${payment.client?.lastName}
*Policy:* ${payment.policy?.policyNumber}
*Plan:* ${payment.policy?.planType}

*Amount Paid:* ${formatCurrency(payment.amount, payment.currency || "USD")}
*Months Covered:* ${payment.monthsCovered || "1 Month"}
*Words:* ${payment.amountInWords || numberToWords(payment.amount)}

*Status:* ${payment.status}

_A Dignified Send-Off_
    `.trim() : "";

    if (loading) return <div className="flex h-screen items-center justify-center">Loading receipt...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!payment) return <div className="p-8 text-center">Payment not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 print:p-0 print:bg-white">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Actions - Hidden on Print */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                    <Link href={`/payments`}>
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Back to Payments
                        </Button>
                    </Link>
                    <div className="flex flex-wrap items-center gap-2">
                        {isAdmin && payment.status === "PENDING" && (
                            <Button
                                onClick={handleConfirm}
                                disabled={confirming}
                                className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                            >
                                {confirming ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                    <CheckCircle className="h-4 w-4" />
                                )}
                                Confirm Payment
                            </Button>
                        )}
                        <Button onClick={handleShareImage} variant="outline" className="gap-2 border-green-200 text-green-700 hover:bg-green-50">
                            <ImageIcon className="h-4 w-4" /> Share Image
                        </Button>
                        <ShareDocumentButton 
                            title={`Payment Receipt - ${payment.receiptNumber}`}
                            text={`Receipt for ${payment.client?.firstName} ${payment.client?.lastName}`}
                            formattedText={formattedText}
                        />
                        <Button onClick={handlePrint} className="gap-2 bg-purple-600 hover:bg-purple-700">
                            <Printer className="h-4 w-4" /> Print Receipt
                        </Button>
                    </div>
                </div>

                {/* Receipt Card */}
                <div ref={receiptRef} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden print:shadow-none print:border print:border-gray-200">

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 1cm;
                        size: A4;
                    }
                    body {
                        margin: 0;
                        background-color: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .print\:hidden {
                        display: none !important;
                    }
                    .bg-white {
                        background-color: white !important;
                    }
                    .shadow-lg {
                        box-shadow: none !important;
                    }
                }
            `}</style>
                    {/* Header */}
                    <div className="bg-white text-gray-900 p-8 md:p-12 text-center relative overflow-hidden print:bg-white print:text-gray-900 flex justify-between items-start border-b border-gray-200">
                        <div className="absolute top-0 right-0 p-8 opacity-5 text-gray-900">
                            <FileText className="h-32 w-32" />
                        </div>
                        <div className="relative z-10 text-left flex items-center gap-4">
                            <div className="h-16 w-16 flex items-center justify-center">
                                <img src="/images/logo.png" alt="Royalty Funeral Services Logo" className="object-contain h-full w-full" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Royalty Funeral Services</h2>
                                <p className="text-gray-500 text-sm">Reg: 2026/12345/07</p>
                            </div>
                        </div>

                        <div className="relative z-10 text-right text-sm text-gray-600">
                            <p className="font-semibold text-gray-900">Contact Information</p>
                            <p>Phone: +263 71 787 4750 / +263 71 787 4747</p>
                            <p>Email: sales@royaltyfuneral.com</p>
                            <p className="max-w-[150px] ml-auto">Stand 15383, Khami Road Kelvin North 11, Bulawayo</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 border-b border-gray-200 text-gray-900 text-center py-3 print:bg-gray-50 print:text-gray-900">
                        <h1 className="text-2xl font-bold tracking-widest uppercase">Payment Receipt</h1>
                    </div>

                    <div className="p-8 md:p-12 space-y-8 print:p-6 print:space-y-4">
                        {/* Transaction Summary */}
                        <div className="flex flex-col md:flex-row justify-between gap-8 print:gap-4">
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Receipt Number</p>
                                <p className="text-xl font-bold text-gray-900">#{payment.receiptNumber}</p>
                            </div>
                            <div className="space-y-1 md:text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date Issued</p>
                                <p className="text-lg font-medium text-gray-900">{formatDate(payment.createdAt)}</p>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Payer Info */}
                        <div className="grid grid-cols-2 gap-8 print:gap-4">
                            <div className="space-y-4 print:space-y-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payer Details</p>
                                <div>
                                    <p className="font-bold text-gray-900 text-lg">
                                        {payment.client?.firstName} {payment.client?.lastName}
                                    </p>
                                    <p className="text-gray-500">{payment.client?.phone}</p>
                                    <p className="text-gray-500">ID: {payment.client?.idNumber}</p>
                                </div>
                            </div>
                            <div className="space-y-4 print:space-y-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Policy Details</p>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">{payment.policy?.policyNumber}</p>
                                    <p className="text-gray-500">{payment.policy?.planType}</p>
                                    <p className="text-gray-500">Member: {payment.policy?.client?.firstName} {payment.policy?.client?.lastName}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Details Table */}
                        <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider">
                                        <th className="px-6 py-4 print:py-2 font-bold">Description</th>
                                        <th className="px-6 py-4 print:py-2 font-bold text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-700">
                                    <tr className="border-b border-gray-100">
                                        <td className="px-6 py-5 print:py-3">
                                            <p className="font-bold">Insurance Premium Payment</p>
                                            <p className="text-sm text-gray-600 mt-1">Months Covered: <span className="font-semibold">{payment.monthsCovered || "1 Month"}</span></p>
                                            <p className="text-xs text-gray-500 italic mt-1">Status: {payment.status}</p>
                                        </td>
                                        <td className="px-6 py-5 print:py-3 text-right font-bold text-lg">
                                            {formatCurrency(payment.amount, payment.currency || "USD")}
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr className="bg-purple-50 text-purple-900 font-bold print:bg-purple-50/50">
                                        <td className="px-6 py-4 print:py-2 text-right">Total Paid</td>
                                        <td className="px-6 py-4 print:py-2 text-right text-xl">
                                            {formatCurrency(payment.amount, payment.currency || "USD")}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Amount in Words */}
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amount in Words</p>
                            <p className="text-gray-700 italic font-medium capitalize border-l-4 border-purple-200 pl-4 py-2 bg-purple-50/30">
                                {payment.amountInWords || numberToWords(payment.amount)}
                            </p>
                        </div>

                        {/* Proof of Payment - NEW */}
                        {payment.proofOfPayment && (
                            <div className="space-y-2 no-print-break print:hidden">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <ImageIcon className="h-3 w-3" /> Proof of Payment
                                </p>
                                <div className="rounded-lg border border-gray-200 p-2 bg-white max-w-sm">
                                    <img 
                                        src={payment.proofOfPayment} 
                                        alt="Proof of Payment" 
                                        className="rounded w-full h-auto max-h-[300px] object-contain cursor-pointer"
                                        onClick={() => setShowProofModal(true)}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                    
                                    <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
                                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                                            <DialogHeader>
                                                <DialogTitle>Proof of Payment</DialogTitle>
                                            </DialogHeader>
                                            <div className="flex items-center justify-center p-4">
                                                <img 
                                                    src={payment.proofOfPayment} 
                                                    alt="Full Proof of Payment" 
                                                    className="max-w-full h-auto rounded-lg shadow-lg"
                                                />
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    <Button 
                                        variant="link" 
                                        size="sm"
                                        onClick={() => setShowProofModal(true)}
                                        className="text-xs text-blue-600 hover:underline mt-2 p-0 h-auto print:hidden"
                                    >
                                        View Full Image
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="pt-8 border-t border-gray-100 text-center space-y-4 print:pt-4 print:space-y-2">
                            <div className="flex justify-center gap-12">
                                <div className="space-y-1">
                                    {payment.clientSignature ? (
                                        <img src={payment.clientSignature} alt="Customer Signature" className="h-12 object-contain mx-auto print:h-10" />
                                    ) : (
                                        <div className="h-12 w-48 border-b border-gray-300 mx-auto print:h-8"></div>
                                    )}
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Customer Signature</p>
                                </div>
                                <div className="space-y-1">
                                    {adminSignature || payment.adminSignature ? (
                                        <img src={adminSignature || payment.adminSignature} alt="Company Officer Signature" className="h-12 object-contain mx-auto print:h-10" />
                                    ) : (
                                        <div className="h-12 w-48 border-b border-gray-300 mx-auto print:h-8"></div>
                                    )}
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Administrator ({currentUser?.firstName || 'Staff'})</p>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-8 print:mt-4">
                                Royalty Funeral Services &copy; {new Date().getFullYear()}. All Rights Reserved. This is a computer generated receipt.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
