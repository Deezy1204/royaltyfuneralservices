"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, PenTool, X, Image as ImageIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignatureSelectorProps {
  onSignatureChange: (signature: string | null) => void;
  label?: string;
}

export function SignatureSelector({ onSignatureChange, label = "Signature" }: SignatureSelectorProps) {
  const [type, setType] = useState<"upload" | "digital">("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onSignatureChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSignature = () => {
    setPreview(null);
    onSignatureChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="border-dashed border-2">
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
          <Label className="text-sm font-medium shrink-0">{label} Option</Label>
          <Select 
            value={type} 
            onValueChange={(v: string) => {
              setType(v as "upload" | "digital");
              clearSignature();
            }}
          >
            <SelectTrigger className="w-full sm:w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upload">
                <div className="flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" /> <span>Upload Scan</span>
                </div>
              </SelectItem>
              <SelectItem value="digital">
                <div className="flex items-center gap-2">
                  <PenTool className="w-3.5 h-3.5" /> <span>Digital Pad</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {type === "upload" ? (
          <div className="space-y-3">
            {!preview ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors border-gray-200"
              >
                <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload signature</p>
                  <p className="text-xs text-gray-400">PNG or JPG (best on white background)</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative group">
                <img 
                  src={preview} 
                  alt="Signature" 
                  className="max-h-24 mx-auto rounded border bg-white object-contain"
                />
                <button 
                  onClick={clearSignature}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-2 bg-gray-50/50 border-gray-200">
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <PenTool className="w-5 h-5" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Digital Signature Pad</p>
              <p className="text-xs text-gray-400 italic">Signature capture will be implemented here</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
