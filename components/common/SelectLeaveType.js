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
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "sonner";

/**
 * SelectLeaveType Component
 * A reusable component for selecting leave types from the API
 *
 * @param {Function} onValueChange - Callback function that receives the selected leavetype_id
 * @param {string} value - The currently selected leavetype_id value
 * @param {string} label - Label for the select field
 * @param {boolean} showLabel - Whether to show the label (default: true)
 * @param {boolean} onlyActive - Whether to show only active leave types (default: true)
 * @param {string} endpoint - API endpoint to fetch from (default: "/leave-types/available")
 * @param {boolean} includeAll - Whether to include an "All Types" option (default: false)
 * @param {string} placeholder - Placeholder text
 * @param {boolean} disabled - Whether the select is disabled
 * @param {string} className - Additional CSS classes
 * @param {string} id - HTML id attribute
 */
const SelectLeaveType = ({
  onValueChange,
  value = "",
  label = "Leave Type",
  showLabel = true,
  onlyActive = true,
  endpoint = "/leave-types/available",
  includeAll = false,
  placeholder = "Select leave type",
  disabled = false,
  className = "",
  id,
}) => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLeaveTypes();
  }, [endpoint, onlyActive]);

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await externalApiClient.get(endpoint);

      // Handle different response formats
      let typesData = [];
      if (endpoint === "/leave-types/available") {
        typesData = res.data?.available_leave_types || [];
      } else {
        typesData = res.data?.leave_types || res.data || [];
      }

      if (!Array.isArray(typesData)) {
        typesData = [];
      }

      // Filter by active status if needed
      let filteredTypes = typesData;
      if (onlyActive) {
        filteredTypes = typesData.filter(
          (type) => type.is_active === "Y" || type.is_active === "y"
        );
      }

      // Sort by name for better UX
      filteredTypes.sort((a, b) => {
        const nameA = (a.name || a.leavetype_id || "").toLowerCase();
        const nameB = (b.name || b.leavetype_id || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setLeaveTypes(filteredTypes);
    } catch (error) {
      console.error("Error fetching leave types:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to load leave types";
      setError(errorMessage);
      setLeaveTypes([]);
      // Only show toast for critical errors, not for optional components
      if (endpoint === "/leave-types/available") {
        toast.error("Failed to load leave types");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (newValue) => {
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <Label htmlFor={id} className="mb-2">
          {label}
        </Label>
      )}
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled || loading}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={loading ? "Loading..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {includeAll && <SelectItem value="all">All Types</SelectItem>}
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Spinner size={20} />
              <span className="ml-2 text-sm text-gray-500">Loading...</span>
            </div>
          ) : error ? (
            <SelectItem value="__error__" disabled>
              Failed to load leave types
            </SelectItem>
          ) : leaveTypes.length === 0 ? (
            <SelectItem value="__no_types__" disabled>
              No leave types available
            </SelectItem>
          ) : (
            leaveTypes.map((type) => {
              const leavetypeId = type.leavetype_id || type.id;
              const name = type.name || leavetypeId || "Unknown";
              const displayName = name;

              return (
                <SelectItem key={leavetypeId} value={String(leavetypeId)}>
                  {displayName}
                </SelectItem>
              );
            })
          )}
        </SelectContent>
      </Select>
      {error && !loading && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default SelectLeaveType;
