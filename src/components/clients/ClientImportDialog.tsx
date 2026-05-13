"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { formatDate, formatCurrency, PLAN_COLORS, parseCustomDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Upload, FileUp, Loader2, Edit2, Check, X } from "lucide-react";

interface ClientImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function ClientImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: ClientImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseExcel(selectedFile);
    }
  };

  const parseExcel = (file: File) => {
    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Read all rows as array of arrays first to find data and skip empty ones
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        // Find header row - usually the first non-empty row or the one containing key terms
        let headerIndex = -1;
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (row && row.some(cell => cell && typeof cell === 'string' && 
            (cell.toLowerCase().includes('name') || cell.toLowerCase().includes('id') || cell.toLowerCase().includes('policy')))) {
            headerIndex = i;
            break;
          }
        }

        if (headerIndex === -1) headerIndex = 0; // Fallback to first row

        const headers = rows[headerIndex] as string[];
        const dataRows = rows.slice(headerIndex + 1);

        const mappedClients = dataRows
          .filter(row => row && row.some(cell => cell !== null && cell !== undefined && cell !== ""))
          .map((row) => {
            const client: any = {
              extraFields: {},
              policyData: {
                dependents: {}
              }
            };

            headers.forEach((header: string, idx: number) => {
              if (!header) return;
              const value = row[idx];
              const h = String(header).trim().toLowerCase();

              // Robust mapping logic
              // 1. Primary Name / First Name
              if (h.startsWith("primary name") || h === "primary name") {
                client.firstName = value;
              } else if (!client.firstName && h.match(/^(?!.*spouse|.*dep)(.*first\s*name|.*full\s*name|.*client\s*name|^name$|^first$)/)) {
                client.firstName = value;
              }
              
              // 2. Primary Surname / Last Name
              else if (h.startsWith("primary surname") || h === "primary surname" || h === "primary last name") {
                client.lastName = value;
              } else if (!client.lastName && h.match(/^(?!.*spouse|.*dep)(.*surname|.*last\s*name|^lastname$|^last$)/)) {
                client.lastName = value;
              }

              // 3. Primary Initials
              else if (h.includes("primary initial")) {
                client.initials = value;
              }

              // 4. Primary ID Number
              else if (h.includes("primary id") || h.includes("primary identity")) {
                client.idNumber = String(value || "").trim();
              } else if (!client.idNumber && h.match(/^(?!.*spouse|.*dep)(.*id\s*number|.*id\s*no|.*identity|^id$|.*passport)/)) {
                client.idNumber = String(value || "").trim();
              }

              // 5. Primary Phone
              else if (h.includes("primary phone") || h.includes("primary tel") || h.includes("primary contact")) {
                client.phone = String(value || "").trim();
              } else if (!client.phone && h.match(/^(?!.*spouse|.*dep)(.*tel|.*phone|.*contact|.*mobile|.*cell)/)) {
                client.phone = String(value || "").trim();
              }

              // 6. Primary DOB
              else if (h.includes("primary dob") || h.includes("primary birth") || h.includes("primary date of birth")) {
                client.dateOfBirth = parseCustomDate(String(value || ""));
              } else if (!client.dateOfBirth && h.match(/^(?!.*spouse|.*dep)(.*dob|.*date\s*of\s*birth|.*birth|.*born)/)) {
                client.dateOfBirth = parseCustomDate(String(value || ""));
              }

              // Gender
              else if (h.match(/gender|sex/)) {
                const g = String(value || "").trim().toLowerCase();
                client.gender = g.startsWith("m") ? "Male" : g.startsWith("f") ? "Female" : value;
              }
              // Address
              else if (h.match(/address|street|location/)) {
                client.streetAddress = value;
              }
              // Policy / Plan
              else if (h.match(/product|plan|package/)) {
                client.policyData.planType = value;
              }
              else if (h.match(/policy\s*no|policy\s*number|^policy$/)) {
                client.policyData.policyNumber = value;
              }
              else if (h.match(/status|state/)) {
                client.policyData.status = value;
              }
              else if (h.match(/inception|commencement|start\s*date|joined/)) {
                client.policyData.inceptionDate = parseCustomDate(String(value || ""));
              }
              else if (h.match(/premium\s*usd|total\s*premium|monthly\s*premium/)) {
                const amt = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0;
                client.policyData.premiumAmount = (client.policyData.premiumAmount || 0) + amt;
                client.policyData.currency = "USD";
              }
              else if (h.match(/premium|contribution|amount|price|cost/)) {
                const amt = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0;
                // Avoid double counting if Premium USD was already matched
                if (!client.policyData.premiumAmount) client.policyData.premiumAmount = amt;
              }
              
              // Spouse Mapping
              else if (h.match(/spouse\s*name|spouse\s*first/)) {
                if (!client.policyData.dependents.spouse) client.policyData.dependents.spouse = { relationship: "Spouse" };
                client.policyData.dependents.spouse.firstName = value;
              }
              else if (h.match(/spouse\s*surname|spouse\s*last/)) {
                if (!client.policyData.dependents.spouse) client.policyData.dependents.spouse = { relationship: "Spouse" };
                client.policyData.dependents.spouse.lastName = value;
              }
              else if (h.match(/spouse\s*id|spouse\s*identity/)) {
                if (!client.policyData.dependents.spouse) client.policyData.dependents.spouse = { relationship: "Spouse" };
                client.policyData.dependents.spouse.idNumber = String(value || "").trim();
              }
              else if (h.match(/spouse\s*dob|spouse\s*birth/)) {
                if (!client.policyData.dependents.spouse) client.policyData.dependents.spouse = { relationship: "Spouse" };
                client.policyData.dependents.spouse.dateOfBirth = parseCustomDate(String(value || ""));
              }
              else if (h.match(/spouse\s*premium|spouse\s*amount/)) {
                const amt = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0;
                if (!client.policyData.dependents.spouse) client.policyData.dependents.spouse = { relationship: "Spouse" };
                client.policyData.dependents.spouse.premium = amt;
                // Add to total premium
                client.policyData.premiumAmount = (client.policyData.premiumAmount || 0) + amt;
              }

              // Children Mapping (Child 1, Child 2, etc.)
              else if (h.match(/child\s*(\d+)\s*name/)) {
                const num = h.match(/child\s*(\d+)/)?.[1] || "1";
                if (!client.policyData.dependents[`child_${num}`]) client.policyData.dependents[`child_${num}`] = { relationship: "Child" };
                client.policyData.dependents[`child_${num}`].firstName = value;
              }
              else if (h.match(/child\s*(\d+)\s*surname/)) {
                const num = h.match(/child\s*(\d+)/)?.[1] || "1";
                if (!client.policyData.dependents[`child_${num}`]) client.policyData.dependents[`child_${num}`] = { relationship: "Child" };
                client.policyData.dependents[`child_${num}`].lastName = value;
              }
              else if (h.match(/child\s*(\d+)\s*dob|child\s*(\d+)\s*birth/)) {
                const num = h.match(/child\s*(\d+)/)?.[1] || "1";
                if (!client.policyData.dependents[`child_${num}`]) client.policyData.dependents[`child_${num}`] = { relationship: "Child" };
                client.policyData.dependents[`child_${num}`].dateOfBirth = parseCustomDate(String(value || ""));
              }
              else if (h.match(/child\s*(\d+)\s*premium|child\s*(\d+)\s*amount/)) {
                const num = h.match(/child\s*(\d+)/)?.[1] || "1";
                const amt = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0;
                if (!client.policyData.dependents[`child_${num}`]) client.policyData.dependents[`child_${num}`] = { relationship: "Child" };
                client.policyData.dependents[`child_${num}`].premium = amt;
                // Add to total premium
                client.policyData.premiumAmount = (client.policyData.premiumAmount || 0) + amt;
              }
              
              else {
                // Sanitize header for use as key in extraFields (though backend handles it now, good to be safe)
                const safeKey = header.replace(/[\.\$#\[\]\/]/g, "_");
                client.extraFields[safeKey] = value;
              }
            });

            return client;
          });

        setParsedData(mappedClients);
      } catch (err) {
        console.error("Parse error:", err);
        toast.error("Failed to parse Excel file");
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      const res = await fetch("/api/clients/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clients: parsedData }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success > 0) {
          toast.success(`Successfully imported ${result.success} clients${result.failed > 0 ? ` (${result.failed} failed)` : ""}`);
          onImportComplete();
          onOpenChange(false);
        } else if (result.failed > 0) {
          toast.error(`Import failed: ${result.failed} clients could not be saved. Check file format.`);
          console.error("Import failures:", result.errors);
        } else {
          toast.warning("No valid clients were found in the file to import.");
        }
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to import clients");
      }
    } catch (err) {
      toast.error("An error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  const updateClient = (index: number, field: string, value: any) => {
    const newData = [...parsedData];
    newData[index] = { ...newData[index], [field]: value };
    setParsedData(newData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col data-[state=open]:!animate-zoom-out data-[state=open]:!zoom-in-100 data-[state=open]:!slide-in-from-top-0 data-[state=open]:!slide-in-from-left-0">
        <DialogHeader>
          <DialogTitle>Import Clients from Excel</DialogTitle>
        </DialogHeader>

        {!parsedData.length ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-gray-50">
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-500 mb-4">
              Upload an Excel file (.xlsx) to import clients
            </p>
            <Button onClick={() => fileInputRef.current?.click()} disabled={isParsing}>
              {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
              Select File
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-hidden border rounded-md">
              <ScrollArea className="h-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>ID Number</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((client, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{client.firstName}</TableCell>
                        <TableCell>{client.lastName}</TableCell>
                        <TableCell>{client.idNumber}</TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell>{client.policyData?.planType}</TableCell>
                        <TableCell>{client.policyData?.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setParsedData([])}>
                Reset
              </Button>
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import {parsedData.length} Clients
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
