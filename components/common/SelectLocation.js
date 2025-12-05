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
 * SelectLocation Component
 * A reusable component for selecting locations
 * 
 * @param {string} value - The selected location ID (controlled component)
 * @param {Function} onValueChange - Callback when location selection changes (receives locationId)
 * @param {string} placeholder - Placeholder text for the select
 * @param {string} label - Label text for the select field
 * @param {boolean} showLabel - Whether to show the label (default: true)
 * @param {boolean} required - Whether the field is required
 * @param {boolean} showShortName - Whether to display short_name in the option (default: true)
 * @param {boolean} allowNone - Whether to show "None" option (default: false)
 * @param {string} className - Additional CSS classes
 * @param {boolean} disabled - Whether the select is disabled
 * @param {string} id - HTML id for the select
 * @param {Array} locations - Optional pre-fetched locations array (if provided, won't fetch)
 * @param {Function} onLocationsLoad - Optional callback when locations are loaded
 */
const SelectLocation = ({
  value = "",
  onValueChange,
  placeholder = "Select location",
  label = "Location",
  showLabel = true,
  required = false,
  showShortName = true,
  allowNone = false,
  className = "",
  disabled = false,
  id,
  locations: providedLocations = null,
  onLocationsLoad,
}) => {
  const [locations, setLocations] = useState(providedLocations || []);
  const [loading, setLoading] = useState(!providedLocations);
  const [error, setError] = useState("");

  const fetchLocations = useCallback(async () => {
    // If locations are provided, don't fetch
    if (providedLocations) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await externalApiClient.get("/locations");
      const locationsData = res.data?.locations || res.data || [];
      setLocations(Array.isArray(locationsData) ? locationsData : []);
      
      if (onLocationsLoad) {
        onLocationsLoad(locationsData);
      }
    } catch (e) {
      console.error("Failed to load locations:", e);
      const errorMessage = getErrorMessage(e, "Failed to load locations");
      setError(errorMessage);
      toast.error(errorMessage);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [providedLocations, onLocationsLoad]);

  useEffect(() => {
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providedLocations]);

  // Update locations if providedLocations changes
  useEffect(() => {
    if (providedLocations) {
      setLocations(providedLocations);
      setLoading(false);
    }
  }, [providedLocations]);

  const handleValueChange = (newValue) => {
    if (onValueChange) {
      onValueChange(newValue === "none" ? "" : newValue);
    }
  };

  const getLocationDisplayName = (loc) => {
    const name = loc.name || loc.location_name || "";
    const shortName = loc.short_name || "";
    
    if (showShortName && shortName) {
      return `${name} (${shortName})`;
    }
    return name;
  };

  const getLocationId = (loc) => {
    return String(loc.locationid || loc.id || loc.location_id || "");
  };

  return (
    <div className={className}>
      {showLabel && (
        <Label htmlFor={id} className="mb-3">
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
          <SelectValue placeholder={loading ? "Loading locations..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Spinner />
              <span className="ml-2 text-sm text-gray-500">Loading...</span>
            </div>
          ) : error ? (
            <SelectItem value="__error__" disabled>
              Error loading locations
            </SelectItem>
          ) : locations.length === 0 ? (
            <SelectItem value="__no_locations__" disabled>
              No locations available
            </SelectItem>
          ) : (
            <>
              {allowNone && (
                <SelectItem value="none">None</SelectItem>
              )}
              {locations.map((loc) => {
                const locId = getLocationId(loc);
                const displayName = getLocationDisplayName(loc);
                
                return (
                  <SelectItem key={locId} value={locId}>
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

export default SelectLocation;

