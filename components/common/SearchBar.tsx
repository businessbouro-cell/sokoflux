"use client";

import { Search } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  className?: string;
}

export function SearchBar({ placeholder = "Rechercher...", onSearch, debounceMs = 300, className }: SearchBarProps) {
  const [value, setValue] = useState("");

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      setValue(q);
      const timer = setTimeout(() => onSearch(q), debounceMs);
      return () => clearTimeout(timer);
    },
    [onSearch, debounceMs]
  );

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#E8E4DB] bg-white text-sm focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20"
      />
    </div>
  );
}
