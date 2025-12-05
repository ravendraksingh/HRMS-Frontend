"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import OrganizationInfoCard from "@/components/common/OrganizationInfoCard";
import { getErrorMessage } from "@/lib/emsUtil";
import {
  Building2,
  Calendar,
  Edit2,
  Save,
  X,
  Globe,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
} from "lucide-react";

const OrganizationPage = () => {
  const [organization, setOrganization] = useState({
    orgid: "NIYAVA",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [draftOrganization, setDraftOrganization] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  
  // Financial Years state
  const [financialYears, setFinancialYears] = useState([]);
  const [financialYearsLoading, setFinancialYearsLoading] = useState(false);
  const [financialYearsError, setFinancialYearsError] = useState("");
  const [addingFinancialYear, setAddingFinancialYear] = useState(false);
  const [editingFinancialYearId, setEditingFinancialYearId] = useState(null);
  const [newFinancialYear, setNewFinancialYear] = useState({
    financial_year: "",
    start_date: "",
    end_date: "",
    is_active: "Y",
    is_current: "N",
  });
  const [draftFinancialYear, setDraftFinancialYear] = useState({});

  useEffect(() => {
    fetchOrganization();
    fetchFinancialYears();
  }, []);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      const res = await externalApiClient.get(
        `/organization/${organization.orgid}`
      );
      setOrganization(res.data);
      setError("");
    } catch (e) {
      console.error("Error fetching organization:", e);
      setError("Error fetching organization");
      toast.error("Failed to load organization");
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  };

  const validateOrganization = (org) => {
    const errors = {};
    if (!org.orgid || org.orgid.trim() === "") {
      errors.orgid = "Organization ID is required";
    }
    if (!org.name || org.name.trim() === "") {
      errors.name = "Organization Name is required";
    } else if (org.name.trim().length > 200) {
      errors.name = "Organization Name must be 200 characters or less";
    }
    if (
      org.logo_url &&
      org.logo_url.trim() &&
      !/^https?:\/\/.+/.test(org.logo_url)
    ) {
      errors.logo_url = "Logo URL must start with http:// or https://";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEdit = () => {
    setIsEditing(true);
    setDraftOrganization({ ...organization });
    setError("");
    setValidationErrors({});
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setDraftOrganization({});
    setError("");
    setValidationErrors({});
  };

  const handleDraftChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Enforce character limits
    if (name === "orgid") {
      processedValue = value.toUpperCase();
    } else if (name === "name" && processedValue.length > 200) {
      processedValue = processedValue.slice(0, 200);
    }

    setDraftOrganization((prev) => ({ ...prev, [name]: processedValue }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name, value) => {
    setDraftOrganization((prev) => ({ ...prev, [name]: value }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!validateOrganization(draftOrganization)) {
      toast.error("Please fix the validation errors");
      return;
    }

    try {
      const payload = {
        orgid: draftOrganization.orgid?.trim(),
        name: draftOrganization.name?.trim(),
        short_name: draftOrganization.short_name?.trim() || null,
        logo_url: draftOrganization.logo_url?.trim() || null,
        is_active: draftOrganization.is_active || "Y",
      };

      await externalApiClient.patch(
        `/organization/${draftOrganization.orgid}`,
        payload
      );
      toast.success("Organization updated successfully!");
      handleCancelEdit();
      setError("");
      await fetchOrganization();
    } catch (error) {
      console.error("Error updating organization:", error);
      const errorMsg = getErrorMessage(error, "Failed to update organization");
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  // Financial Years functions
  const fetchFinancialYears = async () => {
    try {
      setFinancialYearsLoading(true);
      setFinancialYearsError("");
      const res = await externalApiClient.get("/financial-years");
      
      // Handle different response structures
      const financialYearsData =
        res.data?.financial_years ||
        res.data?.data ||
        res.data ||
        [];
      
      // Normalize to array of objects
      const normalizedYears = financialYearsData.map((item) => {
        if (typeof item === "string") {
          // If it's just a string, create an object
          const [startYear, endYear] = item.split("-");
          const startDate = `${startYear}-04-01`;
          const endDate = `${parseInt(startYear) + 1}-03-31`;
          return {
            id: item,
            financial_year: item,
            start_date: startDate,
            end_date: endDate,
            is_active: "Y",
            is_current: "N",
          };
        }
        return {
          id: item.id || item.financial_year || item.year,
          financial_year: item.financial_year || item.year || item.value || item,
          start_date: item.start_date || item.startDate || "",
          end_date: item.end_date || item.endDate || "",
          is_active: item.is_active || item.isActive || "Y",
          is_current: item.is_current || item.isCurrent || "N",
        };
      });
      
      setFinancialYears(normalizedYears);
    } catch (e) {
      console.error("Error fetching financial years:", e);
      setFinancialYearsError("Error fetching financial years");
      toast.error("Failed to load financial years");
      setFinancialYears([]);
    } finally {
      setFinancialYearsLoading(false);
    }
  };

  const handleAddFinancialYear = () => {
    setAddingFinancialYear(true);
    setNewFinancialYear({
      financial_year: "",
      start_date: "",
      end_date: "",
      is_active: "Y",
      is_current: "N",
    });
    setFinancialYearsError("");
  };

  const handleCancelAddFinancialYear = () => {
    setAddingFinancialYear(false);
    setNewFinancialYear({
      financial_year: "",
      start_date: "",
      end_date: "",
      is_active: "Y",
      is_current: "N",
    });
    setFinancialYearsError("");
  };

  const handleNewFinancialYearChange = (e) => {
    const { name, value } = e.target;
    setNewFinancialYear((prev) => ({ ...prev, [name]: value }));
    
    // Auto-calculate financial year from start date if provided
    if (name === "start_date" && value) {
      const date = new Date(value);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      if (month >= 4) {
        const nextYear = (year + 1).toString().slice(-2);
        const financialYear = `${year}-${nextYear}`;
        setNewFinancialYear((prev) => ({
          ...prev,
          financial_year: financialYear,
          end_date: `${year + 1}-03-31`,
        }));
      } else {
        const prevYear = year - 1;
        const currentYearShort = year.toString().slice(-2);
        const financialYear = `${prevYear}-${currentYearShort}`;
        setNewFinancialYear((prev) => ({
          ...prev,
          financial_year: financialYear,
          end_date: `${year}-03-31`,
        }));
      }
    }
  };

  const handleSaveNewFinancialYear = async () => {
    if (!newFinancialYear.financial_year || !newFinancialYear.financial_year.trim()) {
      setFinancialYearsError("Financial year is required");
      toast.error("Financial year is required");
      return;
    }
    
    if (!newFinancialYear.start_date) {
      setFinancialYearsError("Start date is required");
      toast.error("Start date is required");
      return;
    }
    
    if (!newFinancialYear.end_date) {
      setFinancialYearsError("End date is required");
      toast.error("End date is required");
      return;
    }

    // Validate financial year format (YYYY-YY)
    if (!/^\d{4}-\d{2}$/.test(newFinancialYear.financial_year.trim())) {
      setFinancialYearsError("Financial year must be in format YYYY-YY (e.g., 2024-25)");
      toast.error("Financial year must be in format YYYY-YY");
      return;
    }

    try {
      const payload = {
        financial_year: newFinancialYear.financial_year.trim(),
        start_date: newFinancialYear.start_date,
        end_date: newFinancialYear.end_date,
        is_active: newFinancialYear.is_active || "Y",
        is_current: newFinancialYear.is_current || "N",
      };

      await externalApiClient.post("/financial-years", payload);
      toast.success("Financial year added successfully!");
      handleCancelAddFinancialYear();
      setFinancialYearsError("");
      await fetchFinancialYears();
    } catch (error) {
      console.error("Error adding financial year:", error);
      const errorMsg = getErrorMessage(error, "Failed to add financial year");
      setFinancialYearsError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleEditFinancialYear = (financialYear) => {
    setEditingFinancialYearId(financialYear.id || financialYear.financial_year);
    setDraftFinancialYear({ ...financialYear });
    setFinancialYearsError("");
  };

  const handleCancelEditFinancialYear = () => {
    setEditingFinancialYearId(null);
    setDraftFinancialYear({});
    setFinancialYearsError("");
  };

  const handleDraftFinancialYearChange = (e) => {
    const { name, value } = e.target;
    setDraftFinancialYear((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEditFinancialYear = async (financialYear) => {
    if (!draftFinancialYear.financial_year || !draftFinancialYear.financial_year.trim()) {
      setFinancialYearsError("Financial year is required");
      toast.error("Financial year is required");
      return;
    }

    try {
      const id = financialYear.id || financialYear.financial_year;
      const payload = {
        financial_year: draftFinancialYear.financial_year.trim(),
        start_date: draftFinancialYear.start_date,
        end_date: draftFinancialYear.end_date,
        is_active: draftFinancialYear.is_active || "Y",
        is_current: draftFinancialYear.is_current || "N",
      };

      await externalApiClient.patch(`/financial-years/${id}`, payload);
      toast.success("Financial year updated successfully!");
      handleCancelEditFinancialYear();
      setFinancialYearsError("");
      await fetchFinancialYears();
    } catch (error) {
      console.error("Error updating financial year:", error);
      const errorMsg = getErrorMessage(error, "Failed to update financial year");
      setFinancialYearsError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDeleteFinancialYear = async (financialYear) => {
    if (!confirm(`Are you sure you want to delete financial year ${financialYear.financial_year}?`)) {
      return;
    }
    
    try {
      const id = financialYear.id || financialYear.financial_year;
      await externalApiClient.delete(`/financial-years/${id}`);
      toast.success("Financial year deleted successfully!");
      await fetchFinancialYears();
    } catch (error) {
      console.error("Error deleting financial year:", error);
      const errorMsg = getErrorMessage(error, "Failed to delete financial year");
      toast.error(errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="px-5 py-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Organization</h1>
          <OrganizationInfoCard maxWidth="1000px" />
          <Card className="mt-6">
            <CardContent className="py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="text-gray-500">Loading organization details...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="px-5 py-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Organization</h1>
          <OrganizationInfoCard maxWidth="1000px" />
          <Card className="mt-6">
            <CardContent className="py-12 text-center text-gray-500">
              No organization data found.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-6">
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="max-w-[1000px] mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <div className="max-w-[1000px] mx-auto">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    Organization Details
                  </CardTitle>
                  <CardDescription className="mt-1">
                    View and manage organization information
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button
                    onClick={handleEdit}
                    variant="outline"
                    className="gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              {isEditing ? (
                <div className="space-y-6">
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label className="mb-2 text-sm font-medium">
                          Organization ID
                        </Label>
                        <Input
                          value={draftOrganization.orgid || ""}
                          disabled
                          name="orgid"
                          placeholder="Organization ID"
                          className="bg-gray-50 cursor-not-allowed"
                          style={{ textTransform: "uppercase" }}
                        />
                        <p className="text-xs text-gray-500 mt-1.5">
                          Organization ID cannot be changed
                        </p>
                      </div>
                      <div>
                        <Label className="mb-2 text-sm font-medium">
                          Organization Name{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={draftOrganization.name || ""}
                          onChange={handleDraftChange}
                          name="name"
                          placeholder="Enter organization name"
                          className={
                            validationErrors.name
                              ? "border-red-500 focus-visible:ring-red-500"
                              : ""
                          }
                          required
                          maxLength={200}
                        />
                        {validationErrors.name && (
                          <p className="text-red-500 text-sm mt-1.5">
                            {validationErrors.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="mb-2 text-sm font-medium">
                          Short Name
                        </Label>
                        <Input
                          value={draftOrganization.short_name || ""}
                          onChange={handleDraftChange}
                          name="short_name"
                          placeholder="Enter short name"
                          maxLength={50}
                        />
                      </div>
                      <div>
                        <Label className="mb-2 text-sm font-medium">
                          Status
                        </Label>
                        <Select
                          value={draftOrganization.is_active || "Y"}
                          onValueChange={(value) =>
                            handleSelectChange("is_active", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Y">Active</SelectItem>
                            <SelectItem value="N">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-2 text-sm font-medium">
                          Logo URL
                        </Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            value={draftOrganization.logo_url || ""}
                            onChange={handleDraftChange}
                            name="logo_url"
                            type="url"
                            placeholder="https://example.com/logo.png"
                            className={`pl-10 ${
                              validationErrors.logo_url
                                ? "border-red-500 focus-visible:ring-red-500"
                                : ""
                            }`}
                          />
                        </div>
                        {validationErrors.logo_url && (
                          <p className="text-red-500 text-sm mt-1.5">
                            {validationErrors.logo_url}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveEdit}
                      disabled={
                        !draftOrganization.orgid?.trim() ||
                        !draftOrganization.name?.trim()
                      }
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Header with Name and Status */}
                  <div className="flex items-start justify-between pb-4 border-b">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {organization.name}
                        </h3>
                        {organization.short_name && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            {organization.short_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        organization.is_active === "Y" ? "default" : "secondary"
                      }
                      className={`gap-1.5 ${
                        organization.is_active === "Y"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-red-100 text-red-800 hover:bg-red-100"
                      }`}
                    >
                      {organization.is_active === "Y" ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {organization.is_active === "Y" ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {/* Basic Information Grid */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">
                          Organization ID
                        </p>
                        <p className="text-base font-semibold text-gray-900">
                          {organization.orgid}
                        </p>
                      </div>
                      {organization.short_name && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">
                            Short Name
                          </p>
                          <p className="text-base font-semibold text-gray-900">
                            {organization.short_name}
                          </p>
                        </div>
                      )}
                      {organization.logo_url && (
                        <div className="md:col-span-2 space-y-1">
                          <p className="text-sm font-medium text-gray-500">
                            Logo URL
                          </p>
                          <a
                            href={organization.logo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium flex items-center gap-1.5"
                          >
                            <Globe className="h-4 w-4" />
                            {organization.logo_url}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Years Management Section */}
          <Card className="shadow-sm mt-6">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-blue-600" />
                    Financial Years
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Manage organization financial years (all active and inactive)
                  </CardDescription>
                </div>
                {!addingFinancialYear && (
                  <Button
                    onClick={handleAddFinancialYear}
                    variant="outline"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Financial Year
                  </Button>
                )}
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              {financialYearsError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                  {financialYearsError}
                </div>
              )}

              {addingFinancialYear ? (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">
                    Add New Financial Year
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 text-sm font-medium">
                        Start Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        name="start_date"
                        value={newFinancialYear.start_date}
                        onChange={handleNewFinancialYearChange}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1.5">
                        Financial year typically starts on April 1st
                      </p>
                    </div>
                    <div>
                      <Label className="mb-2 text-sm font-medium">
                        End Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        name="end_date"
                        value={newFinancialYear.end_date}
                        onChange={handleNewFinancialYearChange}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1.5">
                        Financial year typically ends on March 31st
                      </p>
                    </div>
                    <div>
                      <Label className="mb-2 text-sm font-medium">
                        Financial Year <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        name="financial_year"
                        value={newFinancialYear.financial_year}
                        onChange={handleNewFinancialYearChange}
                        placeholder="e.g., 2024-25"
                        required
                        pattern="\d{4}-\d{2}"
                      />
                      <p className="text-xs text-gray-500 mt-1.5">
                        Format: YYYY-YY (auto-calculated from start date)
                      </p>
                    </div>
                    <div>
                      <Label className="mb-2 text-sm font-medium">Status</Label>
                      <Select
                        value={newFinancialYear.is_active || "Y"}
                        onValueChange={(value) =>
                          setNewFinancialYear((prev) => ({
                            ...prev,
                            is_active: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Y">Active</SelectItem>
                          <SelectItem value="N">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="mb-2 text-sm font-medium">Is Current</Label>
                      <Select
                        value={newFinancialYear.is_current || "N"}
                        onValueChange={(value) =>
                          setNewFinancialYear((prev) => ({
                            ...prev,
                            is_current: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Y">Yes</SelectItem>
                          <SelectItem value="N">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      onClick={handleCancelAddFinancialYear}
                      variant="outline"
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveNewFinancialYear}
                      disabled={
                        !newFinancialYear.financial_year?.trim() ||
                        !newFinancialYear.start_date ||
                        !newFinancialYear.end_date
                      }
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : financialYearsLoading ? (
                <div className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="text-gray-500">Loading financial years...</p>
                  </div>
                </div>
              ) : financialYears.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  No financial years found. Click "Add Financial Year" to create one.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                            Financial Year
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                            Start Date
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                            End Date
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                            Is Current
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {financialYears.map((fy) => {
                          const isEditing = editingFinancialYearId === (fy.id || fy.financial_year);
                          return isEditing ? (
                            <tr key={fy.id || fy.financial_year} className="border-b">
                              <td className="py-3 px-4">
                                <Input
                                  name="financial_year"
                                  value={draftFinancialYear.financial_year || ""}
                                  disabled
                                  readOnly
                                  className="w-full bg-gray-50 cursor-not-allowed"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <Input
                                  type="date"
                                  name="start_date"
                                  value={draftFinancialYear.start_date || ""}
                                  onChange={handleDraftFinancialYearChange}
                                  className="w-full"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <Input
                                  type="date"
                                  name="end_date"
                                  value={draftFinancialYear.end_date || ""}
                                  onChange={handleDraftFinancialYearChange}
                                  className="w-full"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <Select
                                  value={draftFinancialYear.is_active || "Y"}
                                  onValueChange={(value) =>
                                    setDraftFinancialYear((prev) => ({
                                      ...prev,
                                      is_active: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Y">Active</SelectItem>
                                    <SelectItem value="N">Inactive</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-3 px-4">
                                <Select
                                  value={draftFinancialYear.is_current || "N"}
                                  onValueChange={(value) =>
                                    setDraftFinancialYear((prev) => ({
                                      ...prev,
                                      is_current: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Y">Yes</SelectItem>
                                    <SelectItem value="N">No</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    onClick={() => handleCancelEditFinancialYear()}
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                  >
                                    <X className="h-3 w-3" />
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={() => handleSaveEditFinancialYear(fy)}
                                    size="sm"
                                    className="gap-1"
                                  >
                                    <Save className="h-3 w-3" />
                                    Save
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <tr key={fy.id || fy.financial_year} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <span className="font-medium text-gray-900">
                                  {fy.financial_year}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-gray-700">
                                {fy.start_date
                                  ? new Date(fy.start_date).toLocaleDateString()
                                  : "-"}
                              </td>
                              <td className="py-3 px-4 text-gray-700">
                                {fy.end_date
                                  ? new Date(fy.end_date).toLocaleDateString()
                                  : "-"}
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  variant={
                                    fy.is_active === "Y" ? "default" : "secondary"
                                  }
                                  className={`gap-1.5 ${
                                    fy.is_active === "Y"
                                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                                      : "bg-red-100 text-red-800 hover:bg-red-100"
                                  }`}
                                >
                                  {fy.is_active === "Y" ? (
                                    <CheckCircle2 className="h-3 w-3" />
                                  ) : (
                                    <XCircle className="h-3 w-3" />
                                  )}
                                  {fy.is_active === "Y" ? "Active" : "Inactive"}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  variant={
                                    fy.is_current === "Y" ? "default" : "secondary"
                                  }
                                  className={`gap-1.5 ${
                                    fy.is_current === "Y"
                                      ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                      : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                  }`}
                                >
                                  {fy.is_current === "Y" ? (
                                    <CheckCircle2 className="h-3 w-3" />
                                  ) : (
                                    <XCircle className="h-3 w-3" />
                                  )}
                                  {fy.is_current === "Y" ? "Current" : "Not Current"}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    onClick={() => handleEditFinancialYear(fy)}
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                    Edit
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteFinancialYear(fy)}
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrganizationPage;
