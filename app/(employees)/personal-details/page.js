"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import { useAuth } from "@/components/auth/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateDisplay } from "@/lib/formatDateDisplay";

const PersonalDetailsPage = () => {
  const { user } = useAuth();
  const [personalDetails, setPersonalDetails] = useState({});
  const [education, setEducation] = useState([]);
  const [employmentHistory, setEmploymentHistory] = useState([]);
  const [family, setFamily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user?.user_id) {
      fetchPersonalDetails();
      fetchEducation();
      fetchEmploymentHistory();
      fetchFamily();
    }
  }, [user]);

  // Helper function to normalize date to YYYY-MM-DD format for date inputs
  const normalizeDateForInput = (dateValue) => {
    if (!dateValue) return "";

    try {
      let date;

      // If it's already in YYYY-MM-DD format, return as is
      if (
        typeof dateValue === "string" &&
        dateValue.match(/^\d{4}-\d{2}-\d{2}$/)
      ) {
        return dateValue;
      }

      // If it's already a Date object
      if (dateValue instanceof Date) {
        date = dateValue;
      }
      // If it's a string, try to parse it
      else if (typeof dateValue === "string") {
        // Try parsing as ISO string first
        date = new Date(dateValue);

        // If that fails, try adding time component
        if (isNaN(date.getTime())) {
          date = new Date(dateValue + "T00:00:00");
        }
      }
      // If it's a number (timestamp)
      else if (typeof dateValue === "number") {
        date = new Date(dateValue);
      } else {
        return "";
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "";
      }

      // Format as YYYY-MM-DD for date input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error normalizing date:", error, dateValue);
      return "";
    }
  };

  const fetchPersonalDetails = async () => {
    try {
      // Get employee ID - must be user.employee_id
      const employeeId = user?.employee_id;

      if (!employeeId) {
        toast.error("Employee ID not found. Please contact support.");
        setLoading(false);
        return;
      }

      const res = await externalApiClient.get(
        `/employees/${employeeId}/personal`
      );
      const personalData = res.data || {};

      // Get organization_id from user object
      const orgId = user?.organization_id;

      // Store original data in personalDetails
      setPersonalDetails(personalData);

      // Normalize date fields to YYYY-MM-DD format for date inputs in formData
      const normalizedData = { ...personalData };
      if (normalizedData.dob) {
        normalizedData.dob = normalizeDateForInput(normalizedData.dob);
      }
      setFormData(normalizedData);
    } catch (error) {
      console.error("Error fetching personal details:", error);
      const errorMessage =
        error?.response?.data?.message || error?.message || "Unknown error";
      toast.error(`Failed to load personal details: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchEducation = async () => {
    try {
      const employeeId = user?.employee_id;
      if (!employeeId) return;

      const res = await externalApiClient.get(
        `/employees/${employeeId}/education`
      );
      setEducation(res.data.education);
    } catch (error) {
      console.error("Failed to load education", error);
    }
  };

  const fetchEmploymentHistory = async () => {
    try {
      const employeeId = user?.employee_id;
      if (!employeeId) return;

      const res = await externalApiClient.get(
        `/employees/${employeeId}/employment-history`
      );
      setEmploymentHistory(res.data.history);
    } catch (error) {
      console.error("Failed to load employment history", error);
    }
  };

  const fetchFamily = async () => {
    try {
      const employeeId = user?.employee_id;
      if (!employeeId) return;

      const res = await externalApiClient.get(
        `/employees/${employeeId}/family`
      );
      setFamily(res.data.family);
    } catch (error) {
      console.error("Failed to load family", error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate Date of Birth
    if (
      !formData.dob ||
      formData.dob === "" ||
      formData.dob === null ||
      formData.dob === undefined
    ) {
      newErrors.dob = "Date of Birth is required";
    } else {
      // Parse the date string (format: YYYY-MM-DD)
      const dobDate = new Date(formData.dob + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of today for comparison

      // Check if date is valid
      if (isNaN(dobDate.getTime())) {
        newErrors.dob = "Date of Birth is invalid";
      } else {
        // Calculate minimum date (16 years ago from today)
        const minAgeDate = new Date(today);
        minAgeDate.setFullYear(today.getFullYear() - 16);
        minAgeDate.setHours(0, 0, 0, 0);

        // Calculate maximum date (120 years ago from today)
        const maxAgeDate = new Date(today);
        maxAgeDate.setFullYear(today.getFullYear() - 120);
        maxAgeDate.setHours(0, 0, 0, 0);

        // Normalize dobDate to start of day for comparison
        const dobNormalized = new Date(dobDate);
        dobNormalized.setHours(0, 0, 0, 0);

        if (dobNormalized > today) {
          newErrors.dob = "Date of Birth cannot be in the future";
        } else if (dobNormalized > minAgeDate) {
          newErrors.dob = "Date of Birth must be at least 16 years ago";
        } else if (dobNormalized < maxAgeDate) {
          newErrors.dob = "Date of Birth is invalid (maximum age is 120 years)";
        }
      }
    }

    // Validate Gender
    if (!formData.gender || formData.gender === "") {
      newErrors.gender = "Gender is required";
    } else {
      const validGenders = ["male", "female", "other"];
      if (!validGenders.includes(formData.gender.toLowerCase())) {
        newErrors.gender = "Please select a valid gender";
      }
    }

    // Validate Marital Status
    if (!formData.marital_status || formData.marital_status.trim() === "") {
      newErrors.marital_status = "Marital Status is required";
    } else {
      const validStatuses = ["single", "married", "divorced"];
      if (!validStatuses.includes(formData.marital_status.toLowerCase())) {
        newErrors.marital_status = "Please select a valid marital status";
      }
    }

    // Validate Primary Phone
    if (!formData.phone_primary || formData.phone_primary.trim() === "") {
      newErrors.phone_primary = "Primary Phone is required";
    } else {
      // Validate phone format (numbers, spaces, dashes, parentheses, +)
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(formData.phone_primary.trim())) {
        newErrors.phone_primary = "Please enter a valid phone number";
      } else if (formData.phone_primary.trim().replace(/\D/g, "").length < 10) {
        newErrors.phone_primary =
          "Phone number must contain at least 10 digits";
      }
    }

    // Validate Address Line 1
    if (!formData.address_line1 || formData.address_line1.trim() === "") {
      newErrors.address_line1 = "Address Line 1 is required";
    } else if (formData.address_line1.trim().length < 5) {
      newErrors.address_line1 = "Address must be at least 5 characters";
    }

    // Validate City
    if (!formData.city || formData.city.trim() === "") {
      newErrors.city = "City is required";
    } else if (formData.city.trim().length < 2) {
      newErrors.city = "City must be at least 2 characters";
    }

    // Validate State
    if (!formData.state || formData.state.trim() === "") {
      newErrors.state = "State is required";
    } else if (formData.state.trim().length < 2) {
      newErrors.state = "State must be at least 2 characters";
    }

    // Validate Postal Code
    if (!formData.postal_code || formData.postal_code.trim() === "") {
      newErrors.postal_code = "Postal Code is required";
    } else {
      // Allow alphanumeric postal codes (e.g., US ZIP, UK postcodes)
      const postalCodeRegex = /^[A-Za-z0-9\s\-]{4,10}$/;
      if (!postalCodeRegex.test(formData.postal_code.trim())) {
        newErrors.postal_code =
          "Please enter a valid postal code (4-10 characters)";
      }
    }

    // Validate Country
    if (!formData.country || formData.country.trim() === "") {
      newErrors.country = "Country is required";
    } else if (formData.country.trim().length < 2) {
      newErrors.country = "Country must be at least 2 characters";
    }

    // Validate Emergency Contact Name
    if (
      !formData.emergency_contact_name ||
      formData.emergency_contact_name.trim() === ""
    ) {
      newErrors.emergency_contact_name = "Emergency Contact Name is required";
    } else if (formData.emergency_contact_name.trim().length < 2) {
      newErrors.emergency_contact_name = "Name must be at least 2 characters";
    } else if (
      !/^[A-Za-z\s\.\-']+$/.test(formData.emergency_contact_name.trim())
    ) {
      newErrors.emergency_contact_name =
        "Name can only contain letters, spaces, hyphens, and apostrophes";
    }

    // Validate Emergency Contact Relation
    if (
      !formData.emergency_contact_relation ||
      formData.emergency_contact_relation.trim() === ""
    ) {
      newErrors.emergency_contact_relation = "Relation is required";
    } else if (formData.emergency_contact_relation.trim().length < 2) {
      newErrors.emergency_contact_relation =
        "Relation must be at least 2 characters";
    }

    // Validate Emergency Contact Phone
    if (
      !formData.emergency_contact_phone ||
      formData.emergency_contact_phone.trim() === ""
    ) {
      newErrors.emergency_contact_phone = "Emergency Contact Phone is required";
    } else {
      // Validate phone format (numbers, spaces, dashes, parentheses, +)
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(formData.emergency_contact_phone.trim())) {
        newErrors.emergency_contact_phone = "Please enter a valid phone number";
      } else if (
        formData.emergency_contact_phone.trim().replace(/\D/g, "").length < 10
      ) {
        newErrors.emergency_contact_phone =
          "Phone number must contain at least 10 digits";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSavePersonalDetails = async () => {
    // Validate form before saving
    const isValid = validateForm();
    if (!isValid) {
      toast.error("Please fix the validation errors before saving");
      return;
    }

    try {
      // Get employee ID - user.employee_id
      const employeeId = user?.employee_id;

      if (!employeeId) {
        toast.error("Employee ID not found. Please contact support.");
        return;
      }

      // Get organization_id from user object or existing personal details
      const orgId = user?.organization_id;

      if (!orgId) {
        toast.error("Organization ID not found. Please contact support.");
        return;
      }

      // Prepare the data to send, including organization_id
      const dataToSend = {
        ...formData,
        organization_id: orgId,
      };

      const response = await externalApiClient.put(
        `/employees/${employeeId}/personal`,
        dataToSend
      );

      // Refresh personal details after successful update
      await fetchPersonalDetails();
      setEditing(false);
      setErrors({});
      toast.success("Personal details updated successfully!");
    } catch (error) {
      console.error("Error updating personal details:", error);
      const errorMessage =
        error?.response?.data?.message || error?.message || "Unknown error";
      toast.error(`Failed to update personal details: ${errorMessage}`);
    }
  };

  const handleCancelEdit = () => {
    // Reset form data and ensure DOB is normalized
    const resetData = { ...personalDetails };
    if (resetData.dob) {
      resetData.dob = normalizeDateForInput(resetData.dob);
    }
    setFormData(resetData);
    setEditing(false);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDobBlur = () => {
    // Validate DOB when field loses focus
    if (editing && formData.dob) {
      const newErrors = { ...errors };
      const dobDate = new Date(formData.dob + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(dobDate.getTime())) {
        newErrors.dob = "Date of Birth is invalid";
      } else {
        const minAgeDate = new Date(today);
        minAgeDate.setFullYear(today.getFullYear() - 16);
        minAgeDate.setHours(0, 0, 0, 0);

        const maxAgeDate = new Date(today);
        maxAgeDate.setFullYear(today.getFullYear() - 120);
        maxAgeDate.setHours(0, 0, 0, 0);

        const dobNormalized = new Date(dobDate);
        dobNormalized.setHours(0, 0, 0, 0);

        if (dobNormalized > today) {
          newErrors.dob = "Date of Birth cannot be in the future";
        } else if (dobNormalized > minAgeDate) {
          newErrors.dob = "Date of Birth must be at least 16 years ago";
        } else if (dobNormalized < maxAgeDate) {
          newErrors.dob = "Date of Birth is invalid (maximum age is 120 years)";
        } else {
          // Clear error if validation passes
          delete newErrors.dob;
        }
      }
      setErrors(newErrors);
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user selects a value
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-[1000px] p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Personal Details</h1>
        <p className="text-gray-600">Viwe and manage your personal details</p>
      </div>
      <Tabs defaultValue="personal" className="w-full">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <TabsList className="inline-flex w-auto min-w-max sm:w-fit">
            <TabsTrigger
              value="personal"
              className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap flex-shrink-0"
            >
              Personal Info
            </TabsTrigger>
            <TabsTrigger
              value="education"
              className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap flex-shrink-0"
            >
              Education
            </TabsTrigger>
            <TabsTrigger
              value="employment"
              className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap flex-shrink-0"
            >
              Employment History
            </TabsTrigger>
            <TabsTrigger
              value="family"
              className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap flex-shrink-0"
            >
              Family
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="personal">
          <div className="border rounded p-4 bg-white max-w-2xl">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">Personal Information</h2>
              <div className="flex gap-2">
                {editing && (
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={() =>
                    editing ? handleSavePersonalDetails() : setEditing(true)
                  }
                >
                  {editing ? "Save" : "Edit"}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dob" className="mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </Label>
                {editing ? (
                  <div>
                    <Input
                      type="date"
                      name="dob"
                      id="dob"
                      value={normalizeDateForInput(formData.dob)}
                      onChange={handleInputChange}
                      onBlur={handleDobBlur}
                      className={errors.dob ? "border-red-500" : ""}
                      required
                    />
                    {errors.dob && (
                      <p className="text-red-500 text-sm mt-1">{errors.dob}</p>
                    )}
                  </div>
                ) : (
                  <Input
                    type="text"
                    value={formatDateDisplay(formData.dob)}
                    disabled
                  />
                )}
              </div>
              <div>
                <Label htmlFor="gender" className="mb-1">
                  Gender <span className="text-red-500">*</span>
                </Label>
                {editing ? (
                  <div>
                    <Select
                      value={formData.gender || ""}
                      onValueChange={(value) =>
                        handleSelectChange("gender", value)
                      }
                      disabled={!editing}
                    >
                      <SelectTrigger
                        className={`w-full ${
                          errors.gender ? "border-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.gender}
                      </p>
                    )}
                  </div>
                ) : (
                  <Input
                    type="text"
                    value={formData.gender || ""}
                    disabled
                    className="capitalize"
                  />
                )}
              </div>
              <div>
                <Label htmlFor="marital_status" className="mb-1">
                  Marital Status <span className="text-red-500">*</span>
                </Label>
                {editing ? (
                  <div>
                    <Select
                      value={formData.marital_status || ""}
                      onValueChange={(value) =>
                        handleSelectChange("marital_status", value)
                      }
                      disabled={!editing}
                    >
                      <SelectTrigger
                        className={`w-full ${
                          errors.marital_status ? "border-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder="Select marital status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.marital_status && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.marital_status}
                      </p>
                    )}
                  </div>
                ) : (
                  <Input
                    type="text"
                    value={formData.marital_status || ""}
                    disabled
                    className="capitalize"
                  />
                )}
              </div>
              <div>
                <Label htmlFor="phone_primary" className="mb-1">
                  Primary Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  name="phone_primary"
                  id="phone_primary"
                  value={formData.phone_primary || ""}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className={errors.phone_primary ? "border-red-500" : ""}
                  required
                />
                {errors.phone_primary && editing && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.phone_primary}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <Label htmlFor="address_line1" className="mb-1">
                  Address Line 1 <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  name="address_line1"
                  id="address_line1"
                  value={formData.address_line1 || ""}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className={errors.address_line1 ? "border-red-500" : ""}
                  required
                />
                {errors.address_line1 && editing && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.address_line1}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="city" className="mb-1">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  name="city"
                  id="city"
                  value={formData.city || ""}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className={errors.city ? "border-red-500" : ""}
                  required
                />
                {errors.city && editing && (
                  <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                )}
              </div>
              <div>
                <Label htmlFor="state" className="mb-1">
                  State <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  name="state"
                  id="state"
                  value={formData.state || ""}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className={errors.state ? "border-red-500" : ""}
                  required
                />
                {errors.state && editing && (
                  <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                )}
              </div>
              <div>
                <Label htmlFor="postal_code" className="mb-1">
                  Postal Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  name="postal_code"
                  id="postal_code"
                  value={formData.postal_code || ""}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className={errors.postal_code ? "border-red-500" : ""}
                  required
                />
                {errors.postal_code && editing && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.postal_code}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="country" className="mb-1">
                  Country <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  name="country"
                  id="country"
                  value={formData.country || ""}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className={errors.country ? "border-red-500" : ""}
                  required
                />
                {errors.country && editing && (
                  <p className="text-red-500 text-sm mt-1">{errors.country}</p>
                )}
              </div>
              <div>
                <Label htmlFor="emergency_contact_name" className="mb-1">
                  Emergency Contact Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  name="emergency_contact_name"
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name || ""}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className={
                    errors.emergency_contact_name ? "border-red-500" : ""
                  }
                  required
                />
                {errors.emergency_contact_name && editing && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.emergency_contact_name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="emergency_contact_relation" className="mb-1">
                  Relation <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  name="emergency_contact_relation"
                  id="emergency_contact_relation"
                  value={formData.emergency_contact_relation || ""}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className={
                    errors.emergency_contact_relation ? "border-red-500" : ""
                  }
                  required
                />
                {errors.emergency_contact_relation && editing && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.emergency_contact_relation}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="emergency_contact_phone" className="mb-1">
                  Emergency Contact Phone{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  name="emergency_contact_phone"
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone || ""}
                  onChange={handleInputChange}
                  disabled={!editing}
                  className={
                    errors.emergency_contact_phone ? "border-red-500" : ""
                  }
                  required
                />
                {errors.emergency_contact_phone && editing && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.emergency_contact_phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="education">
          <EducationTab
            employeeId={user?.employee_id}
            education={education}
            onUpdate={fetchEducation}
          />
        </TabsContent>

        <TabsContent value="employment">
          <EmploymentHistoryTab
            employeeId={user?.employee_id}
            history={employmentHistory}
            onUpdate={fetchEmploymentHistory}
          />
        </TabsContent>

        <TabsContent value="family">
          <FamilyTab
            employeeId={user?.employee_id}
            family={family}
            onUpdate={fetchFamily}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Education Tab Component
const EducationTab = ({ employeeId, education, onUpdate }) => {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newEducation, setNewEducation] = useState({
    degree: "",
    institution: "",
    field_of_study: "",
    start_date: "",
    end_date: "",
    grade: "",
  });
  const [draftEducation, setDraftEducation] = useState({});

  const handleAdd = async () => {
    try {
      await externalApiClient.post(
        `/employees/${employeeId}/education`,
        newEducation
      );
      toast.success("Education added successfully!");
      setAdding(false);
      setNewEducation({
        degree: "",
        institution: "",
        field_of_study: "",
        start_date: "",
        end_date: "",
        grade: "",
      });
      onUpdate();
    } catch (error) {
      toast.error("Failed to add education");
    }
  };

  const handleEdit = async (edu) => {
    try {
      await externalApiClient.patch(
        `/employees/${employeeId}/education/${edu.id}`,
        draftEducation
      );
      toast.success("Education updated successfully!");
      setEditingId(null);
      onUpdate();
    } catch (error) {
      toast.error("Failed to update education");
    }
  };

  const handleDelete = async (edu) => {
    if (!confirm("Are you sure you want to delete this education record?"))
      return;
    try {
      await externalApiClient.delete(
        `/employees/${employeeId}/education/${edu.id}`
      );
      toast.success("Education deleted successfully!");
      onUpdate();
    } catch (error) {
      toast.error("Failed to delete education");
    }
  };

  return (
    <div className="border rounded p-4 bg-white max-w-4xl">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Education</h2>
        {!adding && (
          <Button onClick={() => setAdding(true)} size="sm">
            Add Education
          </Button>
        )}
      </div>

      {adding && (
        <div className="border rounded p-4 mb-4 bg-gray-50">
          <h3 className="font-semibold mb-3">Add Education</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1">Degree</Label>
              <Input
                value={newEducation.degree}
                onChange={(e) =>
                  setNewEducation({ ...newEducation, degree: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="mb-1">Institution</Label>
              <Input
                value={newEducation.institution}
                onChange={(e) =>
                  setNewEducation({
                    ...newEducation,
                    institution: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label className="mb-1">Field of Study</Label>
              <Input
                value={newEducation.field_of_study}
                onChange={(e) =>
                  setNewEducation({
                    ...newEducation,
                    field_of_study: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label className="mb-1">Start Date</Label>
              <Input
                type="date"
                value={newEducation.start_date}
                onChange={(e) =>
                  setNewEducation({
                    ...newEducation,
                    start_date: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label className="mb-1">End Date</Label>
              <Input
                type="date"
                value={newEducation.end_date}
                onChange={(e) =>
                  setNewEducation({ ...newEducation, end_date: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="mb-1">Grade</Label>
              <Input
                value={newEducation.grade}
                onChange={(e) =>
                  setNewEducation({ ...newEducation, grade: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={handleAdd} size="sm">
              Save
            </Button>
            <Button
              onClick={() => setAdding(false)}
              size="sm"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {education &&
          Array.isArray(education) &&
          education.map((edu) => (
            <div key={edu.id} className="border rounded p-3">
              {editingId === edu.id ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1">Degree</Label>
                    <Input
                      value={draftEducation.degree || ""}
                      onChange={(e) =>
                        setDraftEducation({
                          ...draftEducation,
                          degree: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Institution</Label>
                    <Input
                      value={draftEducation.institution || ""}
                      onChange={(e) =>
                        setDraftEducation({
                          ...draftEducation,
                          institution: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => handleEdit(edu)}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">{edu.degree}</h3>
                    <p className="text-sm text-gray-600">{edu.institution}</p>
                    <p className="text-sm text-gray-600">
                      {formatDateDisplay(edu.start_date)} -{" "}
                      {edu.end_date
                        ? formatDateDisplay(edu.end_date)
                        : "Present"}{" "}
                      | Grade: {edu.grade}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingId(edu.id);
                        setDraftEducation({ ...edu });
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(edu)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

// Employment History Tab Component
const EmploymentHistoryTab = ({ employeeId, history, onUpdate }) => {
  const [adding, setAdding] = useState(false);
  const [newHistory, setNewHistory] = useState({
    company_name: "",
    job_title: "",
    start_date: "",
    end_date: "",
    responsibilities: "",
  });

  const handleAdd = async () => {
    try {
      await externalApiClient.post(
        `/employees/${employeeId}/employment-history`,
        newHistory
      );
      toast.success("Employment history added successfully!");
      setAdding(false);
      setNewHistory({
        company_name: "",
        job_title: "",
        start_date: "",
        end_date: "",
        responsibilities: "",
      });
      onUpdate();
    } catch (error) {
      toast.error("Failed to add employment history");
    }
  };

  return (
    <div className="border rounded p-4 bg-white max-w-4xl">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Employment History</h2>
        {!adding && (
          <Button onClick={() => setAdding(true)} size="sm">
            Add Employment
          </Button>
        )}
      </div>

      {adding && (
        <div className="border rounded p-4 mb-4 bg-gray-50">
          <h3 className="font-semibold mb-3">Add Employment History</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1">Company Name</Label>
              <Input
                value={newHistory.company_name}
                onChange={(e) =>
                  setNewHistory({ ...newHistory, company_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="mb-1">Job Title</Label>
              <Input
                value={newHistory.job_title}
                onChange={(e) =>
                  setNewHistory({ ...newHistory, job_title: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="mb-1">Start Date</Label>
              <Input
                type="date"
                value={newHistory.start_date}
                onChange={(e) =>
                  setNewHistory({ ...newHistory, start_date: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="mb-1">End Date</Label>
              <Input
                type="date"
                value={newHistory.end_date}
                onChange={(e) =>
                  setNewHistory({ ...newHistory, end_date: e.target.value })
                }
              />
            </div>
            <div className="col-span-2">
              <Label className="mb-1">Responsibilities</Label>
              <textarea
                value={newHistory.responsibilities}
                onChange={(e) =>
                  setNewHistory({
                    ...newHistory,
                    responsibilities: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={handleAdd} size="sm">
              Save
            </Button>
            <Button
              onClick={() => setAdding(false)}
              size="sm"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {history &&
          Array.isArray(history) &&
          history.map((h) => (
            <div key={h.id} className="border rounded p-3">
              <h3 className="font-semibold">
                {h.job_title} at {h.company_name}
              </h3>
              <p className="text-sm text-gray-600">
                {formatDateDisplay(h.start_date)} -{" "}
                {formatDateDisplay(h.end_date) || "Present"}
              </p>
              {h.responsibilities && (
                <p className="text-sm text-gray-600 mt-2">
                  {h.responsibilities}
                </p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

// Family Tab Component
const FamilyTab = ({ employeeId, family, onUpdate }) => {
  const [adding, setAdding] = useState(false);
  const [newFamily, setNewFamily] = useState({
    name: "",
    relation: "",
    dob: "",
    phone: "",
    dependent: false,
  });

  const handleAdd = async () => {
    try {
      await externalApiClient.post(
        `/employees/${employeeId}/family`,
        newFamily
      );
      toast.success("Family member added successfully!");
      setAdding(false);
      setNewFamily({
        name: "",
        relation: "",
        dob: "",
        phone: "",
        dependent: false,
      });
      onUpdate();
    } catch (error) {
      toast.error("Failed to add family member");
    }
  };

  const handleDelete = async (member) => {
    if (!confirm("Are you sure you want to delete this family member?")) return;
    try {
      await externalApiClient.delete(
        `/employees/${employeeId}/family/${member.id}`
      );
      toast.success("Family member deleted successfully!");
      onUpdate();
    } catch (error) {
      toast.error("Failed to delete family member");
    }
  };

  return (
    <div className="border rounded p-4 bg-white max-w-4xl">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Family Members</h2>
        {!adding && (
          <Button onClick={() => setAdding(true)} size="sm">
            Add Family Member
          </Button>
        )}
      </div>

      {adding && (
        <div className="border rounded p-4 mb-4 bg-gray-50">
          <h3 className="font-semibold mb-3">Add Family Member</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1">Name</Label>
              <Input
                value={newFamily.name}
                onChange={(e) =>
                  setNewFamily({ ...newFamily, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="mb-1">Relation</Label>
              <Input
                value={newFamily.relation}
                onChange={(e) =>
                  setNewFamily({ ...newFamily, relation: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="mb-1">Date of Birth</Label>
              <Input
                type="date"
                value={newFamily.dob}
                onChange={(e) =>
                  setNewFamily({ ...newFamily, dob: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="mb-1">Phone</Label>
              <Input
                value={newFamily.phone}
                onChange={(e) =>
                  setNewFamily({ ...newFamily, phone: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="mb-1">Dependent</Label>
              <Select
                value={newFamily.dependent ? "1" : "0"}
                onValueChange={(value) =>
                  setNewFamily({ ...newFamily, dependent: value === "1" })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No</SelectItem>
                  <SelectItem value="1">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={handleAdd} size="sm">
              Save
            </Button>
            <Button
              onClick={() => setAdding(false)}
              size="sm"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {family &&
          Array.isArray(family) &&
          family.map((member) => (
            <div key={member.id} className="border rounded p-3">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-gray-600">
                    Relation: {member.relation}
                  </p>
                  {member.dob && (
                    <p className="text-sm text-gray-600">
                      DOB: {formatDateDisplay(member.dob)}
                    </p>
                  )}
                  {member.phone && (
                    <p className="text-sm text-gray-600">
                      Phone: {member.phone}
                    </p>
                  )}
                  {member.dependent && (
                    <p className="text-sm text-blue-600">Dependent</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(member)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default PersonalDetailsPage;
