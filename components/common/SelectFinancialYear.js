"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { externalApiClient } from "@/app/services/externalApiClient";
import { getCurrentFinancialYear } from "@/lib/organizationUtil";

/**
 * SelectFinancialYear Component
 * A reusable component for selecting financial years
 *
 * @param {string} value - The selected financial year in 'YYYY-YY' format (controlled component)
 * @param {Function} onValueChange - Callback when financial year selection changes (receives financialYear)
 * @param {string} placeholder - Placeholder text for the select
 * @param {string} label - Label text for the select field
 * @param {boolean} showLabel - Whether to show the label (default: true)
 * @param {boolean} required - Whether the field is required
 * @param {string} className - Additional CSS classes
 * @param {boolean} disabled - Whether the select is disabled
 * @param {string} id - HTML id for the select
 * @param {number} yearsAhead - Number of years ahead to show (default: 2)
 * @param {number} yearsBehind - Number of years behind to show (default: 0)
 * @param {string} defaultValue - Default value if value is not provided (defaults to current FY)
 */
const SelectFinancialYear = ({
  value = "",
  onValueChange,
  placeholder = "Select financial year",
  label = "Financial Year",
  showLabel = true,
  required = false,
  className = "",
  disabled = false,
  id,
  yearsAhead = 2,
  yearsBehind = 0,
  defaultValue,
}) => {
  const [availableFinancialYears, setAvailableFinancialYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch financial years from API
  useEffect(() => {
    const fetchFinancialYears = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await externalApiClient.get("/financial-years");

        // Handle different response structures
        const financialYearsData =
          response.data?.financial_years ||
          response.data?.data ||
          response.data ||
          [];

        // Ensure we have an array of financial year strings
        if (Array.isArray(financialYearsData)) {
          // If the API returns objects, extract the financial year value
          const years = financialYearsData.map((item) => {
            if (typeof item === "string") {
              return item;
            }
            // Handle object format - try common property names
            return item.financial_year || item.year || item.value || item;
          });
          setAvailableFinancialYears(years);
        } else {
          // Fallback to generated years if API response is unexpected
          const currentFY = getCurrentFinancialYear();
          const startYear = parseInt(currentFY.split("-")[0]);
          const financialYears = [];
          for (let i = -yearsBehind; i <= yearsAhead; i++) {
            const fyStartYear = startYear + i;
            const fyEndYear = (fyStartYear + 1).toString().slice(-2);
            financialYears.push(`${fyStartYear}-${fyEndYear}`);
          }
          setAvailableFinancialYears(financialYears);
        }
      } catch (err) {
        console.error("Error fetching financial years:", err);
        setError(err);
        // Fallback to generated years on error
        const currentFY = getCurrentFinancialYear();
        const startYear = parseInt(currentFY.split("-")[0]);
        const financialYears = [];
        for (let i = -yearsBehind; i <= yearsAhead; i++) {
          const fyStartYear = startYear + i;
          const fyEndYear = (fyStartYear + 1).toString().slice(-2);
          financialYears.push(`${fyStartYear}-${fyEndYear}`);
        }
        setAvailableFinancialYears(financialYears);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialYears();
  }, [yearsAhead, yearsBehind]);

  // Use defaultValue or current FY if value is not provided
  const selectedValue = value || defaultValue || getCurrentFinancialYear();

  const handleValueChange = (newValue) => {
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <div className={className}>
      {showLabel && (
        <Label htmlFor={id} className="mb-1">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      <Select
        value={selectedValue}
        onValueChange={handleValueChange}
        disabled={disabled || loading}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder={loading ? "Loading..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {availableFinancialYears.length > 0 ? (
            availableFinancialYears.map((fyOption) => (
              <SelectItem key={fyOption} value={String(fyOption)}>
                {String(fyOption)}
              </SelectItem>
            ))
          ) : (
            <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
              {loading ? "Loading..." : "No financial years available"}
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SelectFinancialYear;
