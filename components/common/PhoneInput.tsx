"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
}

export function PhoneInput({ value, onChange, error, className, ...props }: PhoneInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex">
        <div className="flex items-center justify-center h-11 px-3 border border-r-0 border-[#E8E4DB] rounded-l-lg bg-[#F7F5F0] text-sm font-medium text-gray-700 select-none">
          🇬🇳 +224
        </div>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="620 000 000"
          value={value ?? ""}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "");
            onChange?.(raw ? `+224${raw}` : "");
          }}
          className={cn(
            "flex-1 h-11 rounded-l-none rounded-r-lg border border-[#E8E4DB] bg-white px-3 py-2 text-sm focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20",
            error && "border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
