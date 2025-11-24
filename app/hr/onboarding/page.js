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
import { externalApiClient } from "@/app/services/externalApiClient";
import {
  UserPlus,
  Building2,
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import OrganizationInfoCard from "@/components/common/OrganizationInfoCard";
import { formatDateToYYYYMMDD } from "@/lib/dateTimeUtil";
import { getErrorMessage } from "@/lib/emsUtil";
import { useAuth } from "@/components/common/AuthContext";

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
    empid: "",
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
    if (user?.empid) {
      fetchDepartments();
      fetchLocations();
      fetchManagers();
      fetchShifts();
      fetchEmployees();
    }
  }, [user?.empid]);

  const fetchDepartments = async () => {
    try {
      const res = await externalApiClient.get("/departments");
      const deptData = res.data?.departments || [];
      setDepartments(deptData);
    } catch (e) {
      console.error("Failed to load departments", e);
      const errorMessage =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        "Failed to load departments";
      toast.error(errorMessage);
      setDepartments([]);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await externalApiClient.get("/locations");
      const locationsData = res.data?.locations || [];
      setLocations(locationsData);
    } catch (e) {
      console.error("Failed to load locations", e);
      const errorMessage =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        "Failed to load locations";
      toast.error(errorMessage);
      setLocations([]);
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await externalApiClient.get("/managers");
      const managersData = res.data?.managers || [];
      setManagers(managersData);
    } catch (e) {
      console.error("Error fetching managers:", e);
      const errorMessage =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        "Failed to load managers";
      toast.error(errorMessage);
      setManagers([]);
    }
  };

  const fetchShifts = async () => {
    try {
      const res = await externalApiClient.get("/attendance/shifts");
      const shiftsData = res.data?.shifts || [];
      setShifts(shiftsData);
    } catch (e) {
      console.error("Failed to load shifts", e);
      const errorMessage =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        "Failed to load shifts";
      toast.error(errorMessage);
      setShifts([]);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await externalApiClient.get("/employees");
      const employeesData = res.data?.employees || [];
      setEmployees(employeesData);
    } catch (e) {
      console.error("Failed to load employees", e);
      const errorMessage =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        "Failed to load employees";
      toast.error(errorMessage);
      setEmployees([]);
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
        if (
          !onboardingData.empid ||
          !onboardingData.name ||
          !onboardingData.email
        ) {
          setError("Employee ID, Name, and Email are required");
          return false;
        }
        // Check if employee ID already exists
        const existingEmployee = employees.find(
          (emp) => emp.empid === onboardingData.empid
        );
        if (existingEmployee) {
          setError("Employee ID already exists. Please use a unique ID.");
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
        empid: onboardingData.empid,
        name: onboardingData.name,
        email: onboardingData.email,
        phone: onboardingData.phone || null,
        department_id: onboardingData.department_id,
        location_id: onboardingData.location_id,
        manager_id: onboardingData.manager_id || null,
      };

      const employeeRes = await apiClient.post(
        "/api/employees",
        employeePayload
      );
      const employeeId =
        employeeRes.data?.empid ||
        employeeRes.data?.id ||
        employeeRes.data?.employee?.empid ||
        employeeRes.data?.employee?.id ||
        employeeRes.data?.data?.empid ||
        employeeRes.data?.data?.id;

      if (!employeeId) {
        // Try to fetch the employee by empid
        const fetchRes = await apiClient.get(
          `/api/employees/${onboardingData.empid}`
        );
        const fetchedData = fetchRes.data?.employee || fetchRes.data;
        const finalEmployeeId = fetchedData?.empid || fetchedData?.id;

        if (!finalEmployeeId) {
          throw new Error("Failed to create employee. Please try again.");
        }

        // Assign shift
        if (onboardingData.shift_id) {
          await apiClient.post(
            `/api/employees/${finalEmployeeId}/shift-assignments`,
            {
              shift_id: onboardingData.shift_id,
              effective_from: onboardingData.shift_effective_from,
            }
          );
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
      const errorMsg = getErrorMessage(error, "Failed to onboard employee");
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setOnboardingData({
      empid: "",
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
        <p className="text-gray-600">
          Complete the onboarding process for new employees
        </p>
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
                  <Label htmlFor="empid">
                    Employee ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="empid"
                    value={onboardingData.empid}
                    onChange={(e) =>
                      handleInputChange("empid", e.target.value.toUpperCase())
                    }
                    placeholder="EMP001"
                    required
                    style={{ textTransform: "uppercase" }}
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
                  onValueChange={(value) =>
                    handleInputChange("department_id", value)
                  }
                >
                  <SelectTrigger id="department_id">
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments &&
                    Array.isArray(departments) &&
                    departments.length > 0 ? (
                      departments.map((dept) => (
                        <SelectItem
                          key={dept.deptid || dept.id || dept.department_id}
                          value={String(
                            dept.deptid || dept.id || dept.department_id
                          )}
                        >
                          {dept.name || dept.department_name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__no_departments__" disabled>
                        No departments available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {onboardingData.department_id && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-700">
                    Selected:{" "}
                    {departments.find(
                      (d) =>
                        String(d.deptid || d.id || d.department_id) ===
                        onboardingData.department_id
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
                  value={
                    onboardingData.manager_id
                      ? String(onboardingData.manager_id)
                      : "none"
                  }
                  onValueChange={(value) =>
                    handleInputChange(
                      "manager_id",
                      value === "none" ? "" : value
                    )
                  }
                >
                  <SelectTrigger id="manager_id">
                    <SelectValue placeholder="Select a manager (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {managers.map((mgr) => (
                      <SelectItem key={mgr.empid} value={String(mgr.empid)}>
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
                      (m) => String(m.empid) === onboardingData.manager_id
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
                  onValueChange={(value) =>
                    handleInputChange("location_id", value)
                  }
                >
                  <SelectTrigger id="location_id">
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem
                        key={loc.id || loc.location_id}
                        value={String(loc.id || loc.location_id)}
                      >
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
                      (l) =>
                        String(l.id || l.location_id) ===
                        onboardingData.location_id
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
                  onValueChange={(value) =>
                    handleInputChange("shift_id", value)
                  }
                >
                  <SelectTrigger id="shift_id">
                    <SelectValue placeholder="Select a shift" />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.map((shift) => (
                      <SelectItem
                        key={shift.id || shift.shift_id}
                        value={String(shift.id || shift.shift_id)}
                      >
                        {shift.name || shift.shift_name} ({shift.start_time} -{" "}
                        {shift.end_time})
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
                  onChange={(e) =>
                    handleInputChange("shift_effective_from", e.target.value)
                  }
                  required
                />
              </div>
              {onboardingData.shift_id && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-700">
                    Selected:{" "}
                    {shifts.find(
                      (s) =>
                        String(s.id || s.shift_id) === onboardingData.shift_id
                    )?.name || "N/A"}{" "}
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
