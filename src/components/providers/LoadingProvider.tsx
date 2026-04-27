"use client";

import * as React from "react";
import {
  Progress,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@/components/animate-ui/components/base/progress";
import { cn } from "@/lib/utils";

interface LoadingContextType {
  startLoading: (label?: string) => void;
  stopLoading: () => void;
  setProgress: (value: number) => void;
}

const LoadingContext = React.createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = React.useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};

export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [label, setLabel] = React.useState("Processing...");
  const [progress, setProgressValue] = React.useState(0);

  const startLoading = React.useCallback((newLabel?: string) => {
    setLabel(newLabel || "Processing...");
    setProgressValue(0);
    setIsLoading(true);
    
    // Clear any existing interval first
    if ((window as any)._loadingInterval) {
        clearInterval((window as any)._loadingInterval);
    }

    // Automatic simulated progress if not manually set
    // This ensures there is always motion
    const interval = setInterval(() => {
        setProgressValue(prev => {
            if (prev >= 95) {
                clearInterval(interval);
                return prev;
            }
            return prev + Math.floor(Math.random() * 10);
        });
    }, 400);
    
    (window as any)._loadingInterval = interval;
  }, []);

  const stopLoading = React.useCallback(() => {
    if ((window as any)._loadingInterval) {
        clearInterval((window as any)._loadingInterval);
    }
    setProgressValue(100);
    setTimeout(() => {
        setIsLoading(false);
        setProgressValue(0);
    }, 500);
  }, []);

  const setProgress = React.useCallback((value: number) => {
    setProgressValue(value);
  }, []);

  const value = React.useMemo(() => ({
    startLoading,
    stopLoading,
    setProgress
  }), [startLoading, stopLoading, setProgress]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/40 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-md px-6">
            <Card className="shadow-2xl border-purple-100 animate-in zoom-in-95 duration-300">
              <CardContent className="pt-6">
                <Progress value={progress} className="space-y-4">
                  <div className="flex items-center justify-between gap-1">
                    <ProgressLabel className="text-lg font-bold text-purple-900">{label}</ProgressLabel>
                    <span className="text-sm font-bold text-purple-600">
                      <ProgressValue />%
                    </span>
                  </div>
                  <ProgressTrack className="h-3 bg-purple-50" />
                </Progress>
                <p className="mt-4 text-center text-xs text-gray-400 italic">Please wait while we complete your request...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

// Internal Card helper since we might not want to import from UI directly in provider
const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("rounded-2xl border bg-white text-card-foreground shadow-sm", className)}>
        {children}
    </div>
);

const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("p-6", className)}>
        {children}
    </div>
);
