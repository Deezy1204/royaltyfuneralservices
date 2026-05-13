"use client";

import { useRef, useEffect, useState } from "react";
import SignaturePad from "signature_pad";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eraser, Check, X } from "lucide-react";

interface SignaturePadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (signature: string) => void;
}

export function SignaturePadModal({ open, onOpenChange, onSave }: SignaturePadModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const initPad = () => {
        if (!canvasRef.current || !containerRef.current) return;
        
        const canvas = canvasRef.current;
        const container = containerRef.current;
        
        // 1. Correctly size the canvas before initializing SignaturePad
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = container.offsetWidth * ratio;
        canvas.height = container.offsetHeight * ratio;
        canvas.getContext("2d")?.scale(ratio, ratio);
        
        // 2. Initialize or Re-initialize the pad
        if (signaturePadRef.current) {
          signaturePadRef.current.off();
        }
        
        signaturePadRef.current = new SignaturePad(canvas, {
          backgroundColor: "rgb(255, 255, 255)",
          penColor: "rgb(0, 0, 0)",
          minWidth: 0.5,
          maxWidth: 2.5,
          throttle: 16, // Smoother drawing
        });
      };

      // Delay initialization until the dialog animation is likely complete
      const timer = setTimeout(initPad, 250);

      const handleResize = () => {
        initPad();
      };

      window.addEventListener("resize", handleResize);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", handleResize);
        if (signaturePadRef.current) {
          signaturePadRef.current.off();
        }
      };
    }
  }, [open]);

  const handleClear = () => {
    signaturePadRef.current?.clear();
  };

  const handleSave = () => {
    if (signaturePadRef.current?.isEmpty()) {
      return;
    }
    const dataUrl = signaturePadRef.current?.toDataURL("image/png");
    if (dataUrl) {
      onSave(dataUrl);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Digital Signature Pad</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <div 
            ref={containerRef}
            className="w-full h-64 border-2 border-gray-200 rounded-lg overflow-hidden bg-white cursor-crosshair touch-none"
          >
            <canvas 
              ref={canvasRef} 
              className="w-full h-full"
            />
          </div>
          <p className="text-xs text-gray-500 text-center italic">
            Please sign within the box above using your mouse or touch screen.
          </p>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between items-center">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={handleClear}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Eraser className="w-4 h-4 mr-2" />
            Clear
          </Button>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="button" 
              size="sm"
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
