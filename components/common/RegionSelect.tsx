"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GUINEA_REGIONS } from "@/constants/regions";

interface RegionSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  includeAll?: boolean;
}

export function RegionSelect({
  value,
  onValueChange,
  placeholder = "Sélectionner une région",
  includeAll = false,
}: RegionSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAll && <SelectItem value="ALL">Toutes les régions</SelectItem>}
        {GUINEA_REGIONS.map((region) => (
          <SelectItem key={region.code} value={region.name}>
            {region.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface CitySelectProps {
  regionName?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function CitySelect({ regionName, value, onValueChange }: CitySelectProps) {
  const region = GUINEA_REGIONS.find((r) => r.name === regionName);
  const cities = region ? [region.name, ...region.prefectures] : [];

  return (
    <Select value={value} onValueChange={onValueChange} disabled={!regionName}>
      <SelectTrigger>
        <SelectValue placeholder="Sélectionner une ville" />
      </SelectTrigger>
      <SelectContent>
        {cities.map((city) => (
          <SelectItem key={city} value={city}>
            {city}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
