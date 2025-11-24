"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { externalApiClient } from "@/app/services/externalApiClient";
import { toast } from "sonner";
import {
  Search,
  List,
  Grid,
  Users,
  Building,
  MapPin,
  User,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

const SearchEmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState("list"); // 'list' or 'grid'
  const [searchCriteria, setSearchCriteria] = useState({
    type: "name", // 'empid', 'name', 'department', 'location'
    value: "",
  });
  const [alphabetFilter, setAlphabetFilter] = useState(null); // A-Z or null
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);

  // Fetch departments and locations for dropdowns
  useEffect(() => {
    fetchDepartments();
    fetchLocations();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await externalApiClient.get("/departments");
      const deptData = res.data?.departments || res.data || [];
      setDepartments(Array.isArray(deptData) ? deptData : []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await externalApiClient.get("/locations");
      const locData = res.data?.locations || res.data || [];
      setLocations(Array.isArray(locData) ? locData : []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  // Fetch employees with search criteria
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();

      // Add search criteria
      if (searchCriteria.value && searchCriteria.value.trim()) {
        params.append("search_type", searchCriteria.type);
        params.append("search_value", searchCriteria.value.trim());
      }

      // Add alphabet filter (for name search)
      if (alphabetFilter) {
        params.append("name_starts_with", alphabetFilter);
      }

      // Add fuzzy search flag
      params.append("fuzzy", "true");

      const queryString = params.toString();
      const url = queryString
        ? `/employees/search?${queryString}`
        : `/employees/search`;

      const res = await externalApiClient.get(url);
      const employeesData = res.data?.employees || res.data || [];
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to fetch employees";
      toast.error(errorMessage);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [searchCriteria, alphabetFilter]);

  // Debounce search input and fetch employees
  useEffect(() => {
    // Only debounce if user is typing (not for alphabet filter or dropdown changes)
    if (searchCriteria.type === "empid" || searchCriteria.type === "name") {
      const timer = setTimeout(() => {
        fetchEmployees();
      }, 500); // 500ms debounce

      return () => clearTimeout(timer);
    } else {
      // For department/location, fetch immediately
      fetchEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchCriteria, alphabetFilter]);

  const handleSearchTypeChange = (type) => {
    setSearchCriteria({ ...searchCriteria, type, value: "" });
    setAlphabetFilter(null); // Clear alphabet filter when changing search type
  };

  const handleSearchValueChange = (value) => {
    setSearchCriteria({ ...searchCriteria, value });
    setAlphabetFilter(null); // Clear alphabet filter when typing
  };

  const handleAlphabetClick = (letter) => {
    if (alphabetFilter === letter) {
      // If clicking the same letter, clear the filter
      setAlphabetFilter(null);
      setSearchCriteria({ ...searchCriteria, value: "" });
    } else {
      setAlphabetFilter(letter);
      setSearchCriteria({ ...searchCriteria, type: "name", value: "" });
    }
  };

  const handleClearSearch = () => {
    setSearchCriteria({ type: "name", value: "" });
    setAlphabetFilter(null);
  };

  const getEmployeeName = (employee) => {
    return (
      employee.employee_name ||
      employee.name ||
      `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
      "N/A"
    );
  };

  const getDepartmentName = (deptId) => {
    if (!deptId) return "N/A";
    const dept = departments.find(
      (d) => d.id === deptId || d.department_id === deptId
    );
    return dept?.name || dept?.department_name || deptId;
  };

  const getLocationName = (locId) => {
    if (!locId) return "N/A";
    const loc = locations.find(
      (l) => l.id === locId || l.location_id === locId
    );
    return loc?.name || loc?.location_name || locId;
  };

  // Generate alphabet array A-Z
  const alphabet = Array.from({ length: 26 }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Search Employees</h1>
        <p className="text-gray-600">
          Search and filter employees by various criteria
        </p>
      </div>

      {/* Search Criteria Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Type and Value */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <Label className="mb-3">Search By</Label>
                <Select
                  value={searchCriteria.type}
                  onValueChange={handleSearchTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empid">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Employee ID
                      </div>
                    </SelectItem>
                    <SelectItem value="name">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Name
                      </div>
                    </SelectItem>
                    <SelectItem value="department">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Department
                      </div>
                    </SelectItem>
                    <SelectItem value="location">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label className="mb-3">Search Value</Label>
                {searchCriteria.type === "department" ? (
                  <Select
                    value={searchCriteria.value}
                    onValueChange={(value) => handleSearchValueChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem
                          key={dept.id || dept.department_id}
                          value={dept.id || dept.department_id}
                        >
                          {dept.name || dept.department_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : searchCriteria.type === "location" ? (
                  <Select
                    value={searchCriteria.value}
                    onValueChange={(value) => handleSearchValueChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Locations</SelectItem>
                      {locations.map((loc) => (
                        <SelectItem
                          key={loc.id || loc.location_id}
                          value={loc.id || loc.location_id}
                        >
                          {loc.name || loc.location_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={
                        searchCriteria.type === "empid"
                          ? "Enter Employee ID..."
                          : "Enter name..."
                      }
                      value={searchCriteria.value}
                      onChange={(e) => handleSearchValueChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                )}
              </div>

              <div className="md:col-span-1 flex items-end">
                <Button
                  variant="outline"
                  onClick={handleClearSearch}
                  className="w-full"
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Alphabet Filter (only for name search) */}
            {searchCriteria.type === "name" && (
              <div>
                <Label className="mb-2 block">Filter by First Letter</Label>
                <div className="flex flex-wrap gap-2">
                  {alphabet.map((letter) => (
                    <Button
                      key={letter}
                      variant={
                        alphabetFilter === letter ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleAlphabetClick(letter)}
                      className={
                        alphabetFilter === letter
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                    >
                      {letter}
                    </Button>
                  ))}
                  {alphabetFilter && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAlphabetFilter(null);
                        setSearchCriteria({ ...searchCriteria, value: "" });
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Toggle and Results Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Results ({employees.length} employee
              {employees.length !== 1 ? "s" : ""})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewType === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewType("list")}
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
              <Button
                variant={viewType === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewType("grid")}
              >
                <Grid className="h-4 w-4 mr-2" />
                Grid
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size={32} />
            </div>
          ) : employees.length > 0 ? (
            viewType === "list" ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.empid || employee.employee_id}>
                        <TableCell className="font-medium">
                          {employee.empid || employee.employee_id}
                        </TableCell>
                        <TableCell>{getEmployeeName(employee)}</TableCell>
                        <TableCell>
                          {getDepartmentName(
                            employee.department_id || employee.department
                          )}
                        </TableCell>
                        <TableCell>
                          {getLocationName(
                            employee.location_id || employee.location
                          )}
                        </TableCell>
                        <TableCell>{employee.email || "N/A"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              employee.is_active === "Y" ||
                              employee.is_active === true ||
                              employee.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {employee.is_active === "Y" ||
                            employee.is_active === true ||
                            employee.status === "active"
                              ? "Active"
                              : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {employee.empid && (
                            <Button asChild variant="outline" size="sm">
                              <Link
                                href={`/hr/manage-employees/${employee.empid}`}
                              >
                                View Details
                              </Link>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map((employee) => (
                  <Card
                    key={employee.empid || employee.employee_id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {getEmployeeName(employee)}
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            ID: {employee.empid || employee.employee_id}
                          </p>
                        </div>
                        <Badge
                          variant={
                            employee.is_active === "Y" ||
                            employee.is_active === true ||
                            employee.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {employee.is_active === "Y" ||
                          employee.is_active === true ||
                          employee.status === "active"
                            ? "Active"
                            : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span>
                            {getDepartmentName(
                              employee.department_id || employee.department
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>
                            {getLocationName(
                              employee.location_id || employee.location
                            )}
                          </span>
                        </div>
                        {employee.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{employee.email}</span>
                          </div>
                        )}
                        {employee.empid && (
                          <div className="pt-2">
                            <Button
                              asChild
                              variant="outline"
                              className="w-full"
                              size="sm"
                            >
                              <Link
                                href={`/hr/manage-employees/${employee.empid}`}
                              >
                                View Details
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">
                {searchCriteria.value || alphabetFilter
                  ? "No employees found matching your search criteria"
                  : "Start searching to find employees"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchEmployeesPage;
