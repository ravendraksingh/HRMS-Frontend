"use client";

import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { externalApiClient } from "@/app/services/externalApiClient";
import { getErrorMessage } from "@/lib/emsUtil";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

/**
 * SelectDepartment Component
 * A reusable component for selecting departments
 * 
 * @param {string} value - The selected department ID (controlled component)
 * @param {Function} onValueChange - Callback when department selection changes (receives departmentId)
 * @param {string} placeholder - Placeholder text for the select
 * @param {string} label - Label text for the select field
 * @param {boolean} showLabel - Whether to show the label (default: true)
 * @param {boolean} required - Whether the field is required
 * @param {boolean} showShortName - Whether to display short_name in the option (default: true)
 * @param {boolean} allowNone - Whether to show "None" option (default: false)
 * @param {string} className - Additional CSS classes
 * @param {boolean} disabled - Whether the select is disabled
 * @param {string} id - HTML id for the select
 * @param {Array} departments - Optional pre-fetched departments array (if provided, won't fetch)
 * @param {Function} onDepartmentsLoad - Optional callback when departments are loaded
 */
const SelectDepartment = ({
  value = "",
  onValueChange,
  placeholder = "Select department",
  label = "Department",
  showLabel = true,
  required = false,
  showShortName = true,
  allowNone = false,
  className = "",
  disabled = false,
  id,
  departments: providedDepartments = null,
  onDepartmentsLoad,
}) => {
  const [departments, setDepartments] = useState(providedDepartments || []);
  const [loading, setLoading] = useState(!providedDepartments);
  const [error, setError] = useState("");

  const fetchDepartments = useCallback(async () => {
    // If departments are provided, don't fetch
    if (providedDepartments) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await externalApiClient.get("/departments");
      const departmentsData = res.data?.departments || res.data || [];
      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
      
      if (onDepartmentsLoad) {
        onDepartmentsLoad(departmentsData);
      }
    } catch (e) {
      console.error("Failed to load departments:", e);
      const errorMessage = getErrorMessage(e, "Failed to load departments");
      setError(errorMessage);
      toast.error(errorMessage);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, [providedDepartments, onDepartmentsLoad]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Update departments if providedDepartments changes
  useEffect(() => {
    if (providedDepartments) {
      setDepartments(providedDepartments);
      setLoading(false);
    }
  }, [providedDepartments]);

  const handleValueChange = (newValue) => {
    if (onValueChange) {
      onValueChange(newValue === "none" ? "" : newValue);
    }
  };

  const getDepartmentDisplayName = (dept) => {
    const name = dept.name || dept.department_name || "";
    const shortName = dept.short_name || "";
    
    if (showShortName && shortName) {
      return `${name} (${shortName})`;
    }
    return name;
  };

  const getDepartmentId = (dept) => {
    return String(dept.deptid || dept.id || dept.department_id || "");
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
        value={value || ""}
        onValueChange={handleValueChange}
        disabled={disabled || loading}
      >
        <SelectTrigger id={id} className={error ? "border-red-500" : ""}>
          <SelectValue placeholder={loading ? "Loading departments..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Spinner />
              <span className="ml-2 text-sm text-gray-500">Loading...</span>
            </div>
          ) : error ? (
            <SelectItem value="__error__" disabled>
              Error loading departments
            </SelectItem>
          ) : departments.length === 0 ? (
            <SelectItem value="__no_departments__" disabled>
              No departments available
            </SelectItem>
          ) : (
            <>
              {allowNone && (
                <SelectItem value="none">None</SelectItem>
              )}
              {departments.map((dept) => {
                const deptId = getDepartmentId(dept);
                const displayName = getDepartmentDisplayName(dept);
                
                return (
                  <SelectItem key={deptId} value={deptId}>
                    {displayName}
                  </SelectItem>
                );
              })}
            </>
          )}
        </SelectContent>
      </Select>
      
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default SelectDepartment;

