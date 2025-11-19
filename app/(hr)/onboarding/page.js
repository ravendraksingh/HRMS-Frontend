"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import apiClient from "@/app/services/internalApiClient";
import { useAuth } from "@/components/auth/AuthContext";
import { UserPlus, Building2, MapPin, Users, Clock, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import OrganizationInfoCard from "@/components/common/OrganizationInfoCard";
import { formatDateToYYYYMMDD } from "@/lib/dateTimeUtil";

const OnboardingPage = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [managers, setManagers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [onboardingData, setOnboardingData] = useState({
    // Step 1: Basic Info
    employee_code: "",
    name: "",
    email: "",
    phone: "",
    
    // Step 2: Department Assignment
    department_id: "",
    
    // Step 3: Manager Assignment
    manager_id: "",
    
    // Step 4: Location Assignment
    location_id: "",
    
    // Step 5: Shift Assignment
    shift_id: "",
    shift_effective_from: formatDateToYYYYMMDD(new Date()),
  });

  const totalSteps = 5;

  useEffect(() => {
    if (user?.user_id) {
      fetchDepartments();
      fetchLocations();
      fetchManagers();
      fetchShifts();
      fetchEmployees();
    }
  }, [user?.user_id]);

  const fetchDepartments = async () => {
    try {
      const res = await apiClient.get("/api/departments");
      let deptData = [];
      if (Array.isArray(res.data)) {
        deptData = res.data;
      } else if (res.data?.departments && Array.isArray(res.data.departments)) {
        deptData = res.data.departments;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        deptData = res.data.data;
      }
      setDepartments(deptData);
    } catch (e) {
      console.error("Failed to load departments", e);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await apiClient.get("/api/locations");
      let locationsData = [];
      if (Array.isArray(res.data)) {
        locationsData = res.data;
      } else if (res.data?.locations && Array.isArray(res.data.locations)) {
        locationsData = res.data.locations;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        locationsData = res.data.data;
      }
      setLocations(locationsData);
    } catch (e) {
      console.error("Failed to load locations", e);
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await apiClient.get("/api/managers");
      let managersData = [];
      if (Array.isArray(res.data)) {
        managersData = res.data;
      } else if (res.data?.managers && Array.isArray(res.data.managers)) {
        managersData = res.data.managers;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        managersData = res.data.data;
      }
      setManagers(managersData);
    } catch (e) {
      console.error("Error fetching managers:", e);
      setManagers([]);
    }
  };

  const fetchShifts = async () => {
    try {
      const res = await apiClient.get("/api/attendance/shifts");
      let shiftsData = [];
      if (Array.isArray(res.data)) {
        shiftsData = res.data;
      } else if (res.data?.shifts && Array.isArray(res.data.shifts)) {
        shiftsData = res.data.shifts;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        shiftsData = res.data.data;
      }
      setShifts(shiftsData);
    } catch (e) {
      console.error("Failed to load shifts", e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get("/api/employees");
      let employeesData = [];
      if (Array.isArray(res.data)) {
        employeesData = res.data;
      } else if (res.data?.employees && Array.isArray(res.data.employees)) {
        employeesData = res.data.employees;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        employeesData = res.data.data;
      }
      setEmployees(employeesData);
    } catch (e) {
      console.error("Failed to load employees", e);
    }
  };

  const handleInputChange = (field, value) => {
    setOnboardingData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError("");
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!onboardingData.employee_code || !onboardingData.name || !onboardingData.email) {
          setError("Employee Code, Name, and Email are required");
          return false;
        }
        // Check if employee code already exists
        const existingEmployee = employees.find(
          (emp) => emp.employee_code === onboardingData.employee_code
        );
        if (existingEmployee) {
          setError("Employee code already exists. Please use a unique code.");
          return false;
        }
        return true;
      case 2:
        if (!onboardingData.department_id) {
          setError("Please select a department");
          return false;
        }
        return true;
      case 3:
        // Manager is optional, so always valid
        return true;
      case 4:
        if (!onboardingData.location_id) {
          setError("Please select a location");
          return false;
        }
        return true;
      case 5:
        if (!onboardingData.shift_id) {
          setError("Please select a shift");
          return false;
        }
        if (!onboardingData.shift_effective_from) {
          setError("Please select an effective date for the shift");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        setError("");
      }
    } else {
      toast.error(error || "Please complete all required fields");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError("");
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast.error(error || "Please complete all required fields");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Create employee first
      const employeePayload = {
        employee_code: onboardingData.employee_code,
        name: onboardingData.name,
        email: onboardingData.email,
        phone: onboardingData.phone || null,
        department_id: onboardingData.department_id,
        location_id: onboardingData.location_id,
        manager_id: onboardingData.manager_id || null,
        organization_id: user?.org_id || user?.organization_id,
      };

      const employeeRes = await apiClient.post("/api/employees", employeePayload);
      const employeeId = employeeRes.data?.id || employeeRes.data?.employee?.id || employeeRes.data?.data?.id;

      if (!employeeId) {
        // Try to fetch the employee by code
        const fetchRes = await apiClient.get(
          `/api/employees?employee_code=${onboardingData.employee_code}`
        );
        const fetchedData = Array.isArray(fetchRes.data)
          ? fetchRes.data[0]
          : fetchRes.data?.employees?.[0] || fetchRes.data?.data?.[0] || fetchRes.data;
        const finalEmployeeId = fetchedData?.id;
        
        if (!finalEmployeeId) {
          throw new Error("Failed to create employee. Please try again.");
        }

        // Assign shift
        if (onboardingData.shift_id) {
          await apiClient.post(`/api/employees/${finalEmployeeId}/shift-assignments`, {
            shift_id: onboardingData.shift_id,
            effective_from: onboardingData.shift_effective_from,
          });
        }

        toast.success("Employee onboarded successfully!");
        resetForm();
        return;
      }

      // Assign shift
      if (onboardingData.shift_id) {
        await apiClient.post(`/api/employees/${employeeId}/shift-assignments`, {
          shift_id: onboardingData.shift_id,
          effective_from: onboardingData.shift_effective_from,
        });
      }

      toast.success("Employee onboarded successfully!");
      resetForm();
    } catch (error) {
      console.error("Error onboarding employee:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to onboard employee";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setOnboardingData({
      employee_code: "",
      name: "",
      email: "",
      phone: "",
      department_id: "",
      manager_id: "",
      location_id: "",
      shift_id: "",
      shift_effective_from: formatDateToYYYYMMDD(new Date()),
    });
    setCurrentStep(1);
    setError("");
  };

  const getStepTitle = (step) => {
    switch (step) {
      case 1:
        return "Basic Information";
      case 2:
        return "Department Assignment";
      case 3:
        return "Manager Assignment";
      case 4:
        return "Location Assignment";
      case 5:
        return "Shift Assignment";
      default:
        return "";
    }
  };

  const getStepIcon = (step) => {
    switch (step) {
      case 1:
        return <UserPlus className="h-5 w-5" />;
      case 2:
        return <Building2 className="h-5 w-5" />;
      case 3:
        return <Users className="h-5 w-5" />;
      case 4:
        return <MapPin className="h-5 w-5" />;
      case 5:
        return <Clock className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Employee Onboarding</h1>
        <p className="text-gray-600">Complete the onboarding process for new employees</p>
      </div>

      <OrganizationInfoCard />

      {/* Progress Steps */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      step === currentStep
                        ? "bg-primary text-primary-foreground border-primary"
                        : step < currentStep
                        ? "bg-green-500 text-white border-green-500"
                        : "bg-gray-100 text-gray-400 border-gray-300"
                    }`}
                  >
                    {step < currentStep ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      getStepIcon(step)
                    )}
                  </div>
                  <p
                    className={`text-xs mt-2 text-center ${
                      step === currentStep ? "font-semibold" : "text-gray-500"
                    }`}
                  >
                    {getStepTitle(step)}
                  </p>
                </div>
                {step < totalSteps && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      step < currentStep ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStepIcon(currentStep)}
            Step {currentStep}: {getStepTitle(currentStep)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_code">
                    Employee Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="employee_code"
                    value={onboardingData.employee_code}
                    onChange={(e) => handleInputChange("employee_code", e.target.value)}
                    placeholder="E-001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={onboardingData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={onboardingData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="john.doe@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={onboardingData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Department Assignment */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="department_id">
                  Department <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={onboardingData.department_id}
                  onValueChange={(value) => handleInputChange("department_id", value)}
                >
                  <SelectTrigger id="department_id">
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id || dept.department_id} value={String(dept.id || dept.department_id)}>
                        {dept.name || dept.department_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {onboardingData.department_id && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-700">
                    Selected:{" "}
                    {departments.find(
                      (d) => String(d.id || d.department_id) === onboardingData.department_id
                    )?.name || "N/A"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Manager Assignment */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manager_id">Manager (Optional)</Label>
                <Select
                  value={onboardingData.manager_id ? String(onboardingData.manager_id) : "none"}
                  onValueChange={(value) => handleInputChange("manager_id", value === "none" ? "" : value)}
                >
                  <SelectTrigger id="manager_id">
                    <SelectValue placeholder="Select a manager (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {managers.map((mgr) => (
                      <SelectItem
                        key={mgr.id || mgr.employee_id || mgr.manager_id}
                        value={String(mgr.id || mgr.employee_id || mgr.manager_id)}
                      >
                        {mgr.name || mgr.employee_name || mgr.manager_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {onboardingData.manager_id && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-700">
                    Selected:{" "}
                    {managers.find(
                      (m) =>
                        String(m.id || m.employee_id || m.manager_id) === onboardingData.manager_id
                    )?.name || "N/A"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Location Assignment */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location_id">
                  Location <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={onboardingData.location_id}
                  onValueChange={(value) => handleInputChange("location_id", value)}
                >
                  <SelectTrigger id="location_id">
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id || loc.location_id} value={String(loc.id || loc.location_id)}>
                        {loc.name || loc.location_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {onboardingData.location_id && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-700">
                    Selected:{" "}
                    {locations.find(
                      (l) => String(l.id || l.location_id) === onboardingData.location_id
                    )?.name || "N/A"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Shift Assignment */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shift_id">
                  Shift <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={onboardingData.shift_id}
                  onValueChange={(value) => handleInputChange("shift_id", value)}
                >
                  <SelectTrigger id="shift_id">
                    <SelectValue placeholder="Select a shift" />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.map((shift) => (
                      <SelectItem key={shift.id || shift.shift_id} value={String(shift.id || shift.shift_id)}>
                        {shift.name || shift.shift_name} (
                        {shift.start_time} - {shift.end_time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shift_effective_from">
                  Effective From <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="shift_effective_from"
                  type="date"
                  value={onboardingData.shift_effective_from}
                  onChange={(e) => handleInputChange("shift_effective_from", e.target.value)}
                  required
                />
              </div>
              {onboardingData.shift_id && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-700">
                    Selected:{" "}
                    {shifts.find((s) => String(s.id || s.shift_id) === onboardingData.shift_id)
                      ?.name || "N/A"}{" "}
                    - Effective from: {onboardingData.shift_effective_from}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            {currentStep < totalSteps ? (
              <Button onClick={handleNext} disabled={loading}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Onboarding..." : "Complete Onboarding"}
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingPage;

