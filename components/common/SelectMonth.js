"use client";

import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFYStartDate, getFYEndDate } from "@/lib/organizationUtil";

/**
 * SelectMonth Component
 * A reusable component for selecting a month within the current financial year
 * 
 * @param {string} value - The selected month in YYYY-MM format (controlled component)
 * @param {Function} onValueChange - Callback when month selection changes (receives YYYY-MM format)
 * @param {string} placeholder - Placeholder text for the select (default: "Select month")
 * @param {string} label - Label text for the select field
 * @param {boolean} showLabel - Whether to show the label (default: false)
 * @param {boolean} required - Whether the field is required
 * @param {string} className - Additional CSS classes
 * @param {boolean} disabled - Whether the select is disabled
 * @param {string} id - HTML id for the select
 */
const SelectMonth = ({
  value = "",
  onValueChange,
  placeholder = "Select month",
  label = "Month",
  showLabel = false,
  required = false,
  className = "",
  disabled = false,
  id,
}) => {
  // Generate months for the current financial year (April to March)
  const months = useMemo(() => {
    const fyStartDate = getFYStartDate(); // e.g., "2025-04-01"
    const fyEndDate = getFYEndDate(); // e.g., "2026-03-31"
    
    const [startYear, startMonth] = fyStartDate.split("-").map(Number);
    const [endYear, endMonth] = fyEndDate.split("-").map(Number);
    
    const monthOptions = [];
    
    // Start from the end date and go backwards to get descending order
    let currentYear = endYear;
    let currentMonth = endMonth;
    
    // Generate all months from end to start
    while (true) {
      const monthStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
      const date = new Date(currentYear, currentMonth - 1, 1);
      const monthName = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      
      monthOptions.push({
        value: monthStr,
        label: monthName,
      });
      
      // Stop if we've reached the start month
      if (currentYear === startYear && currentMonth === startMonth) {
        break;
      }
      
      // Move to previous month
      if (currentMonth === 1) {
        currentMonth = 12;
        currentYear--;
      } else {
        currentMonth--;
      }
    }
    
    return monthOptions;
  }, []);

  return (
    <div className={className}>
      {showLabel && (
        <Label htmlFor={id} className="mb-1">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <Select
        value={value || ""}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full sm:w-[180px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SelectMonth;

