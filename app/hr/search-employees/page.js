"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import SelectDepartment from "@/components/common/SelectDepartment";
import SelectLocation from "@/components/common/SelectLocation";

const SearchEmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState("list"); // 'list' or 'grid'
  
  // Search criteria
  const [departmentId, setDepartmentId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [name, setName] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Track if user has performed a search
  const hasSearchedRef = useRef(false);

  // Fetch employees with search criteria
  const fetchEmployees = useCallback(async () => {
    // Validate that at least one search criteria is provided
    if (!departmentId && !locationId && (!name || !name.trim())) {
      toast.error("Please provide at least one search criteria");
      return;
    }

    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();

      // Add search criteria - support multiple criteria simultaneously
      // Send all provided criteria as separate parameters for the backend to filter
      if (departmentId) {
        params.append("department_id", departmentId);
      }
      if (locationId) {
        params.append("location_id", locationId);
      }
      if (name && name.trim()) {
        params.append("search_type", "name");
        params.append("search_value", name.trim());
        params.append("fuzzy", "true");
      }

      // Add pagination parameters
      params.append("page", currentPage.toString());
      params.append("limit", pageSize.toString());

      const url = `/employees/search?${params.toString()}`;
      const res = await externalApiClient.get(url);
      
      const employeesData = res.data?.employees || res.data || [];
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
      
      // Handle pagination metadata
      const total = res.data?.total || employeesData.length;
      setTotalEmployees(total);
      setTotalPages(Math.ceil(total / pageSize));
    } catch (error) {
      console.error("Error fetching employees:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to fetch employees";
      toast.error(errorMessage);
      setEmployees([]);
      setTotalEmployees(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [departmentId, locationId, name, currentPage, pageSize]);

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page on new search
    hasSearchedRef.current = true;
    fetchEmployees();
  };

  const handleClear = () => {
    setDepartmentId("");
    setLocationId("");
    setName("");
    setEmployees([]);
    setCurrentPage(1);
    setTotalEmployees(0);
    setTotalPages(0);
    hasSearchedRef.current = false;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(Number(newSize));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Fetch employees when page or pageSize changes (only after initial search)
  useEffect(() => {
    if (hasSearchedRef.current) {
      fetchEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  const getEmployeeName = (employee) => {
    return (
      employee.employee_name ||
      employee.name ||
      `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
      "N/A"
    );
  };

  // Get paginated employees for display (client-side pagination fallback)
  const getPaginatedEmployees = () => {
    if (totalPages > 0) {
      // Server-side pagination is working
      return employees;
    }
    // Fallback to client-side pagination if server doesn't support it
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return employees.slice(startIndex, endIndex);
  };

  const displayEmployees = totalPages > 0 ? employees : getPaginatedEmployees();
  const effectiveTotalPages = totalPages > 0 ? totalPages : Math.ceil(employees.length / pageSize);
  const effectiveTotal = totalEmployees > 0 ? totalEmployees : employees.length;

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Search Employees</h1>
        <p className="text-gray-600">
          Search and filter employees by department, location, and name
        </p>
      </div>

      {/* Search Criteria Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Department Filter */}
              <div>
                <SelectDepartment
                  value={departmentId}
                  onValueChange={setDepartmentId}
                  placeholder="Select department"
                  label="Department"
                  showLabel={true}
                  allowNone={true}
                  showShortName={true}
                />
              </div>

              {/* Location Filter */}
              <div>
                <SelectLocation
                  value={locationId}
                  onValueChange={setLocationId}
                  placeholder="Select location"
                  label="Location"
                  showLabel={true}
                  allowNone={true}
                  showShortName={true}
                />
              </div>

              {/* Name Filter */}
              <div>
                <Label htmlFor="name-search" className="mb-3">
                  Name
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name-search"
                    placeholder="Enter employee name..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSearch}
                className="flex items-center gap-2"
                disabled={loading}
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={loading}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle and Results Header */}
      {employees.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Results ({effectiveTotal} employee
                {effectiveTotal !== 1 ? "s" : ""})
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
            ) : displayEmployees.length > 0 ? (
              <>
                {viewType === "list" ? (
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
                        {displayEmployees.map((employee) => (
                          <TableRow key={employee.empid || employee.employee_id}>
                            <TableCell className="font-medium">
                              {employee.empid || employee.employee_id}
                            </TableCell>
                            <TableCell>{getEmployeeName(employee)}</TableCell>
                            <TableCell>
                              {employee.department_name ||
                                employee.department ||
                                "N/A"}
                            </TableCell>
                            <TableCell>
                              {employee.location_name ||
                                employee.location ||
                                "N/A"}
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
                    {displayEmployees.map((employee) => (
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
                                {employee.department_name ||
                                  employee.department ||
                                  "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span>
                                {employee.location_name ||
                                  employee.location ||
                                  "N/A"}
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
                )}

                {/* Pagination Controls */}
                {effectiveTotalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="page-size" className="text-sm">
                        Records per page:
                      </Label>
                      <Select
                        value={pageSize.toString()}
                        onValueChange={(value) => {
                          handlePageSizeChange(value);
                        }}
                      >
                        <SelectTrigger id="page-size" className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handlePageChange(currentPage - 1);
                        }}
                        disabled={currentPage === 1 || loading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {effectiveTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handlePageChange(currentPage + 1);
                        }}
                        disabled={currentPage === effectiveTotalPages || loading}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No employees found on this page</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {employees.length === 0 && !loading && (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">
                {departmentId || locationId || (name && name.trim())
                  ? "No employees found matching your search criteria"
                  : "Please provide at least one search criteria and click Search"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchEmployeesPage;
