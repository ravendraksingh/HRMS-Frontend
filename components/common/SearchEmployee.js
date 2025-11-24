"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { externalApiClient } from "@/app/services/externalApiClient";
import { Search, X, User, Zap } from "lucide-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Badge } from "@/components/ui/badge";

/**
 * Simple fuzzy search function
 * Checks if the search term appears in the text (case-insensitive)
 * and calculates a simple relevance score
 */
const fuzzyMatch = (text, searchTerm) => {
  if (!text || !searchTerm) return { match: false, score: 0 };
  
  const textLower = text.toLowerCase();
  const searchLower = searchTerm.toLowerCase();
  
  // Exact match gets highest score
  if (textLower === searchLower) {
    return { match: true, score: 100 };
  }
  
  // Starts with gets high score
  if (textLower.startsWith(searchLower)) {
    return { match: true, score: 80 };
  }
  
  // Contains gets medium score
  if (textLower.includes(searchLower)) {
    return { match: true, score: 60 };
  }
  
  // Check for partial matches (fuzzy)
  let searchIndex = 0;
  for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
    if (textLower[i] === searchLower[searchIndex]) {
      searchIndex++;
    }
  }
  
  if (searchIndex === searchLower.length) {
    return { match: true, score: 40 };
  }
  
  return { match: false, score: 0 };
};

/**
 * SearchEmployee Component
 * 
 * @param {Function} onSelect - Callback function that receives empid when employee is selected
 * @param {string} placeholder - Placeholder text for search input
 * @param {string} label - Label for the search field
 * @param {string} className - Additional CSS classes
 * @param {boolean} showLabel - Whether to show the label (default: true)
 */
const SearchEmployee = ({
  onSelect,
  placeholder = "Search employee...",
  label = "Search Employee",
  className = "",
  showLabel = true,
}) => {
  const [searchType, setSearchType] = useState("empid"); // "name" or "empid"
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const searchTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch employees from API
  const fetchEmployees = useCallback(async (term, type) => {
    if (!term || term.trim() === "") {
      setResults([]);
      setShowResults(false);
      return;
    }

    // For name search, require minimum 3 characters
    if (type === "name" && term.trim().length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    // For empid search, require minimum 3 characters
    if (type === "empid" && term.trim().length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    try {
      setLoading(true);
      const res = await externalApiClient.get("/employees");
      const employees = res.data?.employees || res.data || [];
      
      if (!Array.isArray(employees)) {
        setResults([]);
        return;
      }

      // Filter and rank employees based on search type
      let filtered = [];
      
      if (type === "empid") {
        // Search by employee ID
        filtered = employees
          .map((emp) => {
            const empid = String(emp.empid || emp.employee_id || emp.id || "");
            const match = fuzzyMatch(empid, term);
            return { ...emp, ...match };
          })
          .filter((emp) => emp.match)
          .sort((a, b) => b.score - a.score)
          .slice(0, 10); // Limit to top 10 results
      } else {
        // Search by name
        filtered = employees
          .map((emp) => {
            const name =
              emp.employee_name ||
              emp.name ||
              `${emp.first_name || ""} ${emp.last_name || ""}`.trim() ||
              "";
            const match = fuzzyMatch(name, term);
            return { ...emp, ...match };
          })
          .filter((emp) => emp.match)
          .sort((a, b) => b.score - a.score)
          .slice(0, 10); // Limit to top 10 results
      }

      setResults(filtered);
      setShowResults(filtered.length > 0);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      fetchEmployees(searchTerm, searchType);
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, searchType, fetchEmployees]);

  // Handle employee selection
  const handleSelect = (employee) => {
    const empid = employee.empid || employee.employee_id || employee.id;
    setSelectedEmployee(employee);
    setSearchTerm(
      searchType === "empid"
        ? String(empid)
        : employee.employee_name ||
            employee.name ||
            `${employee.first_name || ""} ${employee.last_name || ""}`.trim()
    );
    setShowResults(false);
    
    if (onSelect && empid) {
      onSelect(empid, employee);
    }
  };

  // Handle clear selection
  const handleClear = () => {
    setSelectedEmployee(null);
    setSearchTerm("");
    setResults([]);
    setShowResults(false);
    if (onSelect) {
      onSelect(null, null);
    }
  };

  // Get display name for employee
  const getEmployeeDisplayName = (employee) => {
    return (
      employee.employee_name ||
      employee.name ||
      `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
      `Employee ${employee.empid || employee.employee_id || employee.id}`
    );
  };

  // Get employee ID for display
  const getEmployeeId = (employee) => {
    return employee.empid || employee.employee_id || employee.id || "N/A";
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {showLabel && (
        <Label htmlFor="search-employee" className="mb-2 block">
          {label}
        </Label>
      )}
      
      <div className={`flex gap-2 ${searchType === "empid" ? "mb-7" : ""}`}>
        {/* Search Type Selector */}
        <div className="relative">
          <Select
            value={searchType}
            onValueChange={(value) => {
              setSearchType(value);
              setSearchTerm("");
              setResults([]);
              setShowResults(false);
              setSelectedEmployee(null);
              if (onSelect) {
                onSelect(null, null);
              }
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="empid">
                <div className="flex items-center gap-2">
                  <span>Employee ID</span>
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white text-xs px-1.5 py-0">
                    <Zap className="h-3 w-3 mr-1" color="yellow" fill="yellow" />
                    Quick
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
          {/* Visual indicator for Employee ID search */}
          {searchType === "empid" && (
            <div className="absolute top-full left-0 text-xs text-green-600 font-semibold flex items-center gap-1 mt-1.5 whitespace-nowrap">
              <Zap className="h-3 w-3" color="green" fill="yellow" />
              <span>Quick search - instant results!</span>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search-employee"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                if (results.length > 0) {
                  setShowResults(true);
                }
              }}
              placeholder={
                searchType === "empid"
                  ? "Enter Employee ID (min 3 characters)..."
                  : "Enter employee name (min 3 characters)..."
              }
              className="pl-10 pr-10"
            />
            {selectedEmployee && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Spinner />
            </div>
          )}

          {/* Results Dropdown */}
          {showResults && results.length > 0 && (
            <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto shadow-lg">
              <div className="p-2">
                {results.map((employee) => {
                  const empid = getEmployeeId(employee);
                  const displayName = getEmployeeDisplayName(employee);
                  
                  return (
                    <button
                      key={empid}
                      onClick={() => handleSelect(employee)}
                      className="w-full text-left p-2 hover:bg-gray-100 rounded flex items-center gap-3 transition-colors"
                      type="button"
                    >
                      <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {displayName}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {empid}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          {/* No Results Message */}
          {showResults &&
            !loading &&
            results.length === 0 &&
            searchTerm.length >= 3 && (
              <Card className="absolute z-50 w-full mt-1 shadow-lg">
                <div className="p-4 text-center text-gray-500 text-sm">
                  No employees found
                </div>
              </Card>
            )}
        </div>
      </div>

      {/* Selected Employee Display */}
      {selectedEmployee && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue" />
            <span className="text-sm font-medium">
              {getEmployeeDisplayName(selectedEmployee)} (ID: {getEmployeeId(selectedEmployee)})
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default SearchEmployee;

