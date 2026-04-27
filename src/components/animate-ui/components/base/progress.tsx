"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

const ProgressContext = React.createContext<{ value: number }>({ value: 0 });

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, children, ...props }, ref) => {
    return (
      <ProgressContext.Provider value={{ value }}>
        <div
          ref={ref}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          className={cn("w-full", className)}
          {...props}
        >
          {children}
        </div>
      </ProgressContext.Provider>
    );
  }
);
Progress.displayName = "Progress";

export const ProgressLabel = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("text-sm font-medium text-gray-700", className)} {...props}>
    {children}
  </div>
);

export const ProgressTrack = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { value } = React.useContext(ProgressContext);
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-gray-100", className)}
      {...props}
    >
      <div
        className="h-full bg-purple-600 transition-all duration-500 ease-in-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );
};

export const ProgressValue = () => {
  const { value } = React.useContext(ProgressContext);
  return <>{value}</>;
};
