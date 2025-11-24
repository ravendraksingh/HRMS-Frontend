"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import { formatDateDisplay } from "@/lib/formatDateDisplay";
import { normalizeDateForInput } from "./utils";
import { useAuth } from "@/components/common/AuthContext";

// Personal Tab Component
export default function PersonalTab({
  personalDetails,
  onUpdate,
  employeeId,
  isHRView = false,
  hrUserContext = null,
}) {
  const { user: authUser } = useAuth();
  // Use provided employeeId for HR view, otherwise use authenticated user's empid
  const user = isHRView && hrUserContext ? hrUserContext : authUser;
  const targetEmployeeId = employeeId || user?.empid;
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  // Initialize formData when personalDetails changes
  useEffect(() => {
    if (personalDetails && Object.keys(personalDetails).length > 0) {
      const normalizedData = { ...personalDetails };
      if (normalizedData.date_of_birth) {
        normalizedData.date_of_birth = normalizeDateForInput(
          normalizedData.date_of_birth
        );
      }
      if (normalizedData.passport_expiry) {
        normalizedData.passport_expiry = normalizeDateForInput(
          normalizedData.passport_expiry
        );
      }
      if (normalizedData.driving_license_expiry) {
        normalizedData.driving_license_expiry = normalizeDateForInput(
          normalizedData.driving_license_expiry
        );
      }
      setFormData(normalizedData);
    }
  }, [personalDetails]);

  const validateForm = () => {
    const newErrors = {};

    // Validate Date of Birth
    if (
      !formData.date_of_birth ||
      formData.date_of_birth === "" ||
      formData.date_of_birth === null ||
      formData.date_of_birth === undefined
    ) {
      newErrors.date_of_birth = "Date of Birth is required";
    } else {
      const dobDate = new Date(formData.date_of_birth + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(dobDate.getTime())) {
        newErrors.date_of_birth = "Date of Birth is invalid";
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
          newErrors.date_of_birth = "Date of Birth cannot be in the future";
        } else if (dobNormalized > minAgeDate) {
          newErrors.date_of_birth =
            "Date of Birth must be at least 16 years ago";
        } else if (dobNormalized < maxAgeDate) {
          newErrors.date_of_birth =
            "Date of Birth is invalid (maximum age is 120 years)";
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

    // Validate Phone
    if (!formData.phone || formData.phone.trim() === "") {
      newErrors.phone = "Phone is required";
    } else {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = "Please enter a valid phone number";
      } else if (formData.phone.trim().replace(/\D/g, "").length < 10) {
        newErrors.phone = "Phone number must contain at least 10 digits";
      }
    }

    // Validate Alternate Phone (optional)
    if (formData.alternate_phone && formData.alternate_phone.trim() !== "") {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(formData.alternate_phone.trim())) {
        newErrors.alternate_phone = "Please enter a valid phone number";
      } else if (
        formData.alternate_phone.trim().replace(/\D/g, "").length < 10
      ) {
        newErrors.alternate_phone =
          "Phone number must contain at least 10 digits";
      }
    }

    // Validate Permanent Address Line 1
    if (
      !formData.permanent_address_line1 ||
      formData.permanent_address_line1.trim() === ""
    ) {
      newErrors.permanent_address_line1 =
        "Permanent Address Line 1 is required";
    } else if (formData.permanent_address_line1.trim().length < 5) {
      newErrors.permanent_address_line1 =
        "Address must be at least 5 characters";
    }

    // Validate Permanent City
    if (!formData.permanent_city || formData.permanent_city.trim() === "") {
      newErrors.permanent_city = "Permanent City is required";
    } else if (formData.permanent_city.trim().length < 2) {
      newErrors.permanent_city = "City must be at least 2 characters";
    }

    // Validate Permanent State
    if (!formData.permanent_state || formData.permanent_state.trim() === "") {
      newErrors.permanent_state = "Permanent State is required";
    } else if (formData.permanent_state.trim().length < 2) {
      newErrors.permanent_state = "State must be at least 2 characters";
    }

    // Validate Permanent Postal Code
    if (
      !formData.permanent_postal_code ||
      formData.permanent_postal_code.trim() === ""
    ) {
      newErrors.permanent_postal_code = "Permanent Postal Code is required";
    } else {
      const postalCodeRegex = /^[A-Za-z0-9\s\-]{4,10}$/;
      if (!postalCodeRegex.test(formData.permanent_postal_code.trim())) {
        newErrors.permanent_postal_code =
          "Please enter a valid postal code (4-10 characters)";
      }
    }

    // Validate Permanent Country
    if (
      !formData.permanent_country ||
      formData.permanent_country.trim() === ""
    ) {
      newErrors.permanent_country = "Permanent Country is required";
    } else if (formData.permanent_country.trim().length < 2) {
      newErrors.permanent_country = "Country must be at least 2 characters";
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
    const isValid = validateForm();
    if (!isValid) {
      toast.error("Please fix the validation errors before saving");
      return;
    }

    try {
      if (!targetEmployeeId) {
        toast.error("Employee ID not found. Please contact support.");
        return;
      }

      const dataToSend = { ...formData };
      await externalApiClient.put(
        `/employees/${targetEmployeeId}/personal`,
        dataToSend
      );

      await onUpdate();
      setEditing(false);
      setErrors({});
      toast.success("Personal details updated successfully!");
    } catch (error) {
      console.error("Error updating personal details:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Unknown error";
      toast.error(`Failed to update personal details: ${errorMessage}`);
    }
  };

  const handleCancelEdit = () => {
    const resetData = { ...personalDetails };
    if (resetData.date_of_birth) {
      resetData.date_of_birth = normalizeDateForInput(resetData.date_of_birth);
    }
    if (resetData.passport_expiry) {
      resetData.passport_expiry = normalizeDateForInput(
        resetData.passport_expiry
      );
    }
    if (resetData.driving_license_expiry) {
      resetData.driving_license_expiry = normalizeDateForInput(
        resetData.driving_license_expiry
      );
    }
    setFormData(resetData);
    setEditing(false);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDobBlur = () => {
    if (editing && formData.date_of_birth) {
      const newErrors = { ...errors };
      const dobDate = new Date(formData.date_of_birth + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(dobDate.getTime())) {
        newErrors.date_of_birth = "Date of Birth is invalid";
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
          newErrors.date_of_birth = "Date of Birth cannot be in the future";
        } else if (dobNormalized > minAgeDate) {
          newErrors.date_of_birth =
            "Date of Birth must be at least 16 years ago";
        } else if (dobNormalized < maxAgeDate) {
          newErrors.date_of_birth =
            "Date of Birth is invalid (maximum age is 120 years)";
        } else {
          delete newErrors.date_of_birth;
        }
      }
      setErrors(newErrors);
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="border rounded p-4 bg-white max-w-4xl">
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
      <div className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_of_birth" className="mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </Label>
              {editing ? (
                <div>
                  <Input
                    type="date"
                    name="date_of_birth"
                    id="date_of_birth"
                    value={
                      formData.date_of_birth
                        ? normalizeDateForInput(formData.date_of_birth)
                        : ""
                    }
                    onChange={handleInputChange}
                    onBlur={handleDobBlur}
                    className={errors.date_of_birth ? "border-red-500" : ""}
                    required
                  />
                  {errors.date_of_birth && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.date_of_birth}
                    </p>
                  )}
                </div>
              ) : (
                <Input
                  type="text"
                  value={
                    formData.date_of_birth
                      ? formatDateDisplay(formData.date_of_birth)
                      : ""
                  }
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
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
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
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Divorced">Divorced</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
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
              <Label htmlFor="blood_group" className="mb-1">
                Blood Group
              </Label>
              {editing ? (
                <Select
                  value={formData.blood_group || ""}
                  onValueChange={(value) =>
                    handleSelectChange("blood_group", value)
                  }
                  disabled={!editing}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="text"
                  value={formData.blood_group || ""}
                  disabled
                />
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="mb-1">
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                name="phone"
                id="phone"
                value={formData.phone || ""}
                onChange={handleInputChange}
                disabled={!editing}
                className={errors.phone ? "border-red-500" : ""}
                required
              />
              {errors.phone && editing && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>
            <div>
              <Label htmlFor="alternate_phone" className="mb-1">
                Alternate Phone
              </Label>
              <Input
                type="text"
                name="alternate_phone"
                id="alternate_phone"
                value={formData.alternate_phone || ""}
                onChange={handleInputChange}
                disabled={!editing}
                className={errors.alternate_phone ? "border-red-500" : ""}
              />
              {errors.alternate_phone && editing && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.alternate_phone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Permanent Address */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Permanent Address</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="permanent_address_line1" className="mb-1">
                Address Line 1 <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                name="permanent_address_line1"
                id="permanent_address_line1"
                value={formData.permanent_address_line1 || ""}
                onChange={handleInputChange}
                disabled={!editing}
                className={
                  errors.permanent_address_line1 ? "border-red-500" : ""
                }
                required
              />
              {errors.permanent_address_line1 && editing && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.permanent_address_line1}
                </p>
              )}
            </div>
            <div className="col-span-2">
              <Label htmlFor="permanent_address_line2" className="mb-1">
                Address Line 2
              </Label>
              <Input
                type="text"
                name="permanent_address_line2"
                id="permanent_address_line2"
                value={formData.permanent_address_line2 || ""}
                onChange={handleInputChange}
                disabled={!editing}
              />
            </div>
            <div>
              <Label htmlFor="permanent_city" className="mb-1">
                City <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                name="permanent_city"
                id="permanent_city"
                value={formData.permanent_city || ""}
                onChange={handleInputChange}
                disabled={!editing}
                className={errors.permanent_city ? "border-red-500" : ""}
                required
              />
              {errors.permanent_city && editing && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.permanent_city}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="permanent_state" className="mb-1">
                State <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                name="permanent_state"
                id="permanent_state"
                value={formData.permanent_state || ""}
                onChange={handleInputChange}
                disabled={!editing}
                className={errors.permanent_state ? "border-red-500" : ""}
                required
              />
              {errors.permanent_state && editing && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.permanent_state}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="permanent_postal_code" className="mb-1">
                Postal Code <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                name="permanent_postal_code"
                id="permanent_postal_code"
                value={formData.permanent_postal_code || ""}
                onChange={handleInputChange}
                disabled={!editing}
                className={errors.permanent_postal_code ? "border-red-500" : ""}
                required
              />
              {errors.permanent_postal_code && editing && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.permanent_postal_code}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="permanent_country" className="mb-1">
                Country <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                name="permanent_country"
                id="permanent_country"
                value={formData.permanent_country || ""}
                onChange={handleInputChange}
                disabled={!editing}
                className={errors.permanent_country ? "border-red-500" : ""}
                required
              />
              {errors.permanent_country && editing && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.permanent_country}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Current Address */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Current Address</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="current_address_line1" className="mb-1">
                Address Line 1
              </Label>
              <Input
                type="text"
                name="current_address_line1"
                id="current_address_line1"
                value={formData.current_address_line1 || ""}
                onChange={handleInputChange}
                disabled={!editing}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="current_address_line2" className="mb-1">
                Address Line 2
              </Label>
              <Input
                type="text"
                name="current_address_line2"
                id="current_address_line2"
                value={formData.current_address_line2 || ""}
                onChange={handleInputChange}
                disabled={!editing}
              />
            </div>
            <div>
              <Label htmlFor="current_city" className="mb-1">
                City
              </Label>
              <Input
                type="text"
                name="current_city"
                id="current_city"
                value={formData.current_city || ""}
                onChange={handleInputChange}
                disabled={!editing}
              />
            </div>
            <div>
              <Label htmlFor="current_state" className="mb-1">
                State
              </Label>
              <Input
                type="text"
                name="current_state"
                id="current_state"
                value={formData.current_state || ""}
                onChange={handleInputChange}
                disabled={!editing}
              />
            </div>
            <div>
              <Label htmlFor="current_postal_code" className="mb-1">
                Postal Code
              </Label>
              <Input
                type="text"
                name="current_postal_code"
                id="current_postal_code"
                value={formData.current_postal_code || ""}
                onChange={handleInputChange}
                disabled={!editing}
              />
            </div>
            <div>
              <Label htmlFor="current_country" className="mb-1">
                Country
              </Label>
              <Input
                type="text"
                name="current_country"
                id="current_country"
                value={formData.current_country || ""}
                onChange={handleInputChange}
                disabled={!editing}
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Emergency Contact</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergency_contact_name" className="mb-1">
                Contact Name <span className="text-red-500">*</span>
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
                Contact Phone <span className="text-red-500">*</span>
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

        {/* Documents */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Documents</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pan_number" className="mb-1">
                PAN Number
              </Label>
              <Input
                type="text"
                name="pan_number"
                id="pan_number"
                value={formData.pan_number || ""}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder="e.g., ABCDE1234F"
              />
            </div>
            <div>
              <Label htmlFor="aadhaar_number" className="mb-1">
                Aadhaar Number
              </Label>
              <Input
                type="text"
                name="aadhaar_number"
                id="aadhaar_number"
                value={formData.aadhaar_number || ""}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder="12-digit number"
              />
            </div>
            <div>
              <Label htmlFor="passport_number" className="mb-1">
                Passport Number
              </Label>
              <Input
                type="text"
                name="passport_number"
                id="passport_number"
                value={formData.passport_number || ""}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder="e.g., A1234567"
              />
            </div>
            <div>
              <Label htmlFor="passport_expiry" className="mb-1">
                Passport Expiry
              </Label>
              {editing ? (
                <Input
                  type="date"
                  name="passport_expiry"
                  id="passport_expiry"
                  value={
                    formData.passport_expiry
                      ? normalizeDateForInput(formData.passport_expiry)
                      : ""
                  }
                  onChange={handleInputChange}
                  disabled={!editing}
                />
              ) : (
                <Input
                  type="text"
                  value={
                    formData.passport_expiry
                      ? formatDateDisplay(formData.passport_expiry)
                      : ""
                  }
                  disabled
                />
              )}
            </div>
            <div>
              <Label htmlFor="driving_license_number" className="mb-1">
                Driving License Number
              </Label>
              <Input
                type="text"
                name="driving_license_number"
                id="driving_license_number"
                value={formData.driving_license_number || ""}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder="e.g., DL-01-2020-1234567"
              />
            </div>
            <div>
              <Label htmlFor="driving_license_expiry" className="mb-1">
                Driving License Expiry
              </Label>
              {editing ? (
                <Input
                  type="date"
                  name="driving_license_expiry"
                  id="driving_license_expiry"
                  value={
                    formData.driving_license_expiry
                      ? normalizeDateForInput(formData.driving_license_expiry)
                      : ""
                  }
                  onChange={handleInputChange}
                  disabled={!editing}
                />
              ) : (
                <Input
                  type="text"
                  value={
                    formData.driving_license_expiry
                      ? formatDateDisplay(formData.driving_license_expiry)
                      : ""
                  }
                  disabled
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
