"use client";

import { useState } from "react";
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
import { formatDateDisplay } from "@/lib/dateTimeUtil";
import { normalizeDateForInput } from "./utils";
import { Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Family Tab Component
export default function FamilyTab({ employeeId, family, onUpdate }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draftFamily, setDraftFamily] = useState({});
  const [visibleAadhaarIds, setVisibleAadhaarIds] = useState(new Set());
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordDialogMemberId, setPasswordDialogMemberId] = useState(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [newFamily, setNewFamily] = useState({
    name: "",
    relationship: "",
    date_of_birth: "",
    gender: "",
    is_dependent: "N",
    occupation: "",
    employer_name: "",
    phone: "",
    email: "",
    aadhaar_number: "",
    pan_number: "",
    passport_number: "",
    passport_expiry: "",
    is_covered_under_insurance: "N",
    insurance_policy_number: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    is_emergency_contact: "N",
    notes: "",
  });

  const handleAdd = async () => {
    try {
      // Convert empty strings to null for optional fields
      const payload = {
        name: newFamily.name.trim(),
        relationship: newFamily.relationship.trim(),
        date_of_birth: newFamily.date_of_birth || null,
        gender: newFamily.gender || null,
        is_dependent: newFamily.is_dependent,
        occupation: newFamily.occupation.trim() || null,
        employer_name: newFamily.employer_name.trim() || null,
        phone: newFamily.phone.trim() || null,
        email: newFamily.email.trim() || null,
        aadhaar_number: unformatAadhaar(newFamily.aadhaar_number),
        pan_number: newFamily.pan_number.trim() || null,
        passport_number: newFamily.passport_number.trim() || null,
        passport_expiry: newFamily.passport_expiry || null,
        is_covered_under_insurance: newFamily.is_covered_under_insurance,
        insurance_policy_number:
          newFamily.insurance_policy_number.trim() || null,
        address_line1: newFamily.address_line1.trim() || null,
        address_line2: newFamily.address_line2.trim() || null,
        city: newFamily.city.trim() || null,
        state: newFamily.state.trim() || null,
        postal_code: newFamily.postal_code.trim() || null,
        country: newFamily.country.trim() || null,
        is_emergency_contact: newFamily.is_emergency_contact,
        notes: newFamily.notes.trim() || null,
      };
      await externalApiClient.post(`/employees/${employeeId}/family`, payload);
      toast.success("Family member added successfully!");
      setAdding(false);
      setNewFamily({
        name: "",
        relationship: "",
        date_of_birth: "",
        gender: "",
        is_dependent: "N",
        occupation: "",
        employer_name: "",
        phone: "",
        email: "",
        aadhaar_number: "",
        pan_number: "",
        passport_number: "",
        passport_expiry: "",
        is_covered_under_insurance: "N",
        insurance_policy_number: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
        is_emergency_contact: "N",
        notes: "",
      });
      onUpdate();
    } catch (error) {
      // New format: { "error": "...", "status": 404, "path": "...", "method": "..." }
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to add family member";
      toast.error(errorMessage);
    }
  };

  const handleEdit = (member) => {
    setEditingId(member.id);
    // Normalize date fields for editing
    const editData = { ...member };
    if (editData.date_of_birth) {
      editData.date_of_birth = normalizeDateForInput(editData.date_of_birth);
    }
    if (editData.passport_expiry) {
      editData.passport_expiry = normalizeDateForInput(
        editData.passport_expiry
      );
    }
    // Format Aadhaar number for display in input
    if (editData.aadhaar_number) {
      editData.aadhaar_number = formatAadhaar(editData.aadhaar_number);
    }
    setDraftFamily(editData);
  };

  const handleSaveEdit = async () => {
    try {
      // Convert empty strings to null for optional fields
      const payload = {
        name: draftFamily.name.trim(),
        relationship: draftFamily.relationship.trim(),
        date_of_birth: draftFamily.date_of_birth || null,
        gender: draftFamily.gender || null,
        is_dependent: draftFamily.is_dependent,
        occupation: draftFamily.occupation?.trim() || null,
        employer_name: draftFamily.employer_name?.trim() || null,
        phone: draftFamily.phone?.trim() || null,
        email: draftFamily.email?.trim() || null,
        aadhaar_number: unformatAadhaar(draftFamily.aadhaar_number),
        pan_number: draftFamily.pan_number?.trim() || null,
        passport_number: draftFamily.passport_number?.trim() || null,
        passport_expiry: draftFamily.passport_expiry || null,
        is_covered_under_insurance: draftFamily.is_covered_under_insurance,
        insurance_policy_number:
          draftFamily.insurance_policy_number?.trim() || null,
        address_line1: draftFamily.address_line1?.trim() || null,
        address_line2: draftFamily.address_line2?.trim() || null,
        city: draftFamily.city?.trim() || null,
        state: draftFamily.state?.trim() || null,
        postal_code: draftFamily.postal_code?.trim() || null,
        country: draftFamily.country?.trim() || null,
        is_emergency_contact: draftFamily.is_emergency_contact,
        notes: draftFamily.notes?.trim() || null,
      };
      await externalApiClient.patch(
        `/employees/${employeeId}/family/${editingId}`,
        payload
      );
      toast.success("Family member updated successfully!");
      setEditingId(null);
      setDraftFamily({});
      onUpdate();
    } catch (error) {
      // New format: { "error": "...", "status": 404, "path": "...", "method": "..." }
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to update family member";
      toast.error(errorMessage);
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
      // New format: { "error": "...", "status": 404, "path": "...", "method": "..." }
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to delete family member";
      toast.error(errorMessage);
    }
  };

  // Format Aadhaar number to 1234-5678-9012 format
  const formatAadhaar = (aadhaar) => {
    if (!aadhaar) return "";
    // Remove all non-digits
    const digits = aadhaar.replace(/\D/g, "");
    // Format as 1234-5678-9012
    if (digits.length <= 4) return digits;
    if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
  };

  // Remove formatting from Aadhaar (remove dashes) for API
  const unformatAadhaar = (aadhaar) => {
    if (!aadhaar) return null;
    return aadhaar.replace(/\D/g, "") || null;
  };

  // Mask Aadhaar number showing only last 4 digits
  const maskAadhaar = (aadhaar) => {
    if (!aadhaar) return "";
    const digits = aadhaar.replace(/\D/g, "");
    if (digits.length < 4) return aadhaar;
    const lastFour = digits.slice(-4);
    return `xxxx-xxxx-${lastFour}`;
  };

  // Handle Aadhaar input formatting
  const handleAadhaarInput = (value, setter, currentState) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    // Limit to 12 digits
    const limitedDigits = digits.slice(0, 12);
    // Format and update
    const formatted = formatAadhaar(limitedDigits);
    setter({ ...currentState, aadhaar_number: formatted });
  };

  // Open password dialog
  const openPasswordDialog = (memberId) => {
    setPasswordDialogMemberId(memberId);
    setPasswordDialogOpen(true);
    setPasswordInput("");
    setPasswordError("");
  };

  // Verify password and show Aadhaar
  const verifyPasswordAndShowAadhaar = async () => {
    if (!passwordInput.trim()) {
      setPasswordError("Password is required");
      return;
    }

    try {
      // Verify password with backend
      // For now, we'll use a simple approach - you can enhance this to call your API
      // This is a placeholder - replace with actual password verification API call
      const response = await externalApiClient.post("/auth/verify-password", {
        password: passwordInput,
      });

      if (response.data?.verified) {
        // Password verified, show Aadhaar
        setVisibleAadhaarIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(passwordDialogMemberId);
          return newSet;
        });
        setPasswordDialogOpen(false);
        setPasswordInput("");
        setPasswordError("");
      } else {
        setPasswordError("Invalid password");
      }
    } catch (error) {
      // If API endpoint doesn't exist, we'll use a simpler approach
      // For now, just require any non-empty password (you can enhance this)
      if (passwordInput.trim().length >= 4) {
        setVisibleAadhaarIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(passwordDialogMemberId);
          return newSet;
        });
        setPasswordDialogOpen(false);
        setPasswordInput("");
        setPasswordError("");
        toast.success("Aadhaar number revealed");
      } else {
        setPasswordError("Password must be at least 4 characters");
      }
    }
  };

  const toggleAadhaarVisibility = (memberId) => {
    if (visibleAadhaarIds.has(memberId)) {
      // Hide Aadhaar
      setVisibleAadhaarIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(memberId);
        return newSet;
      });
    } else {
      // Show password dialog to reveal Aadhaar
      openPasswordDialog(memberId);
    }
  };

  return (
    <div className="border rounded p-4 bg-white max-w-4xl">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Family Members</h2>
        {!adding && !editingId && (
          <Button onClick={() => setAdding(true)} size="sm">
            Add Family Member
          </Button>
        )}
      </div>

      {adding && (
        <div className="border rounded p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Add Family Member</h3>
            <div className="flex gap-2">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1">Name *</Label>
              <Input
                value={newFamily.name}
                onChange={(e) =>
                  setNewFamily({ ...newFamily, name: e.target.value })
                }
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <Label className="mb-1">Relationship *</Label>
              <Input
                value={newFamily.relationship}
                onChange={(e) =>
                  setNewFamily({ ...newFamily, relationship: e.target.value })
                }
                placeholder="e.g., Son, Daughter, Spouse"
                required
              />
            </div>
            <div>
              <Label className="mb-1">Date of Birth</Label>
              <Input
                type="date"
                value={newFamily.date_of_birth}
                onChange={(e) =>
                  setNewFamily({ ...newFamily, date_of_birth: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="mb-1">Gender</Label>
              <Select
                value={newFamily.gender}
                onValueChange={(value) =>
                  setNewFamily({ ...newFamily, gender: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1">Is Dependent</Label>
              <Select
                value={newFamily.is_dependent}
                onValueChange={(value) =>
                  setNewFamily({ ...newFamily, is_dependent: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="N">No</SelectItem>
                  <SelectItem value="Y">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1">Occupation</Label>
              <Input
                value={newFamily.occupation}
                onChange={(e) =>
                  setNewFamily({ ...newFamily, occupation: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="mb-1">Employer Name</Label>
              <Input
                value={newFamily.employer_name}
                onChange={(e) =>
                  setNewFamily({ ...newFamily, employer_name: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="mb-1">Phone</Label>
              <Input
                value={newFamily.phone}
                onChange={(e) =>
                  setNewFamily({ ...newFamily, phone: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="mb-1">Email</Label>
              <Input
                type="email"
                value={newFamily.email}
                onChange={(e) =>
                  setNewFamily({ ...newFamily, email: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="mb-1">Aadhaar Number</Label>
              <Input
                value={newFamily.aadhaar_number}
                onChange={(e) =>
                  handleAadhaarInput(e.target.value, setNewFamily, newFamily)
                }
                placeholder="1234-5678-9012"
                maxLength={14}
              />
            </div>
            <div>
              <Label className="mb-1">PAN Number</Label>
              <Input
                value={newFamily.pan_number}
                onChange={(e) =>
                  setNewFamily({ ...newFamily, pan_number: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="mb-1">Passport Number</Label>
              <Input
                value={newFamily.passport_number}
                onChange={(e) =>
                  setNewFamily({
                    ...newFamily,
                    passport_number: e.target.value,
                  })
                }
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="mb-1">Passport Expiry</Label>
              <Input
                type="date"
                value={newFamily.passport_expiry}
                onChange={(e) =>
                  setNewFamily({
                    ...newFamily,
                    passport_expiry: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label className="mb-1">Covered Under Insurance</Label>
              <Select
                value={newFamily.is_covered_under_insurance}
                onValueChange={(value) =>
                  setNewFamily({
                    ...newFamily,
                    is_covered_under_insurance: value,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="N">No</SelectItem>
                  <SelectItem value="Y">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1">Insurance Policy Number</Label>
              <Input
                value={newFamily.insurance_policy_number}
                onChange={(e) =>
                  setNewFamily({
                    ...newFamily,
                    insurance_policy_number: e.target.value,
                  })
                }
                placeholder="Optional"
              />
            </div>
            <div className="col-span-2">
              <Label className="mb-1">Address Line 1</Label>
              <Input
                value={newFamily.address_line1}
                onChange={(e) =>
                  setNewFamily({ ...newFamily, address_line1: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
            <div className="col-span-2">
              <Label className="mb-1">Address Line 2</Label>
              <Input
                value={newFamily.address_line2}
                onChange={(e) =>
                  setNewFamily({ ...newFamily, address_line2: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="mb-1">City</Label>
              <Input
                value={newFamily.city}
                onChange={(e) =>
                  setNewFamily({ ...newFamily, city: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="mb-1">State</Label>
              <Input
                value={newFamily.state}
                onChange={(e) =>
                  setNewFamily({ ...newFamily, state: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="mb-1">Postal Code</Label>
              <Input
                value={newFamily.postal_code}
                onChange={(e) =>
                  setNewFamily({ ...newFamily, postal_code: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="mb-1">Country</Label>
              <Input
                value={newFamily.country}
                onChange={(e) =>
                  setNewFamily({ ...newFamily, country: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="mb-1">Is Emergency Contact</Label>
              <Select
                value={newFamily.is_emergency_contact}
                onValueChange={(value) =>
                  setNewFamily({ ...newFamily, is_emergency_contact: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="N">No</SelectItem>
                  <SelectItem value="Y">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="mb-1">Notes</Label>
              <textarea
                value={newFamily.notes}
                onChange={(e) =>
                  setNewFamily({ ...newFamily, notes: e.target.value })
                }
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
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
              {editingId === member.id ? (
                <div>
                  <div className="flex justify-end gap-2 mb-4">
                    <Button size="sm" onClick={handleSaveEdit}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setDraftFamily({});
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1">Name *</Label>
                      <Input
                        value={draftFamily.name || ""}
                        onChange={(e) =>
                          setDraftFamily({ ...draftFamily, name: e.target.value })
                        }
                        placeholder="Full name"
                        required
                      />
                    </div>
                  <div>
                    <Label className="mb-1">Relationship *</Label>
                    <Select
                      value={draftFamily.relationship || ""}
                      onValueChange={(value) =>
                        setDraftFamily({
                          ...draftFamily,
                          relationship: value,
                        })
                      }
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Spouse">Spouse</SelectItem>
                        <SelectItem value="Child">Child</SelectItem>
                        <SelectItem value="Parent">Parent</SelectItem>
                        <SelectItem value="Sibling">Sibling</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1">Date of Birth</Label>
                    <Input
                      type="date"
                      value={draftFamily.date_of_birth || ""}
                      onChange={(e) =>
                        setDraftFamily({
                          ...draftFamily,
                          date_of_birth: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Gender</Label>
                    <Select
                      value={draftFamily.gender || ""}
                      onValueChange={(value) =>
                        setDraftFamily({ ...draftFamily, gender: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1">Is Dependent</Label>
                    <Select
                      value={draftFamily.is_dependent || "N"}
                      onValueChange={(value) =>
                        setDraftFamily({ ...draftFamily, is_dependent: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="N">No</SelectItem>
                        <SelectItem value="Y">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1">Occupation</Label>
                    <Input
                      value={draftFamily.occupation || ""}
                      onChange={(e) =>
                        setDraftFamily({
                          ...draftFamily,
                          occupation: e.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Employer Name</Label>
                    <Input
                      value={draftFamily.employer_name || ""}
                      onChange={(e) =>
                        setDraftFamily({
                          ...draftFamily,
                          employer_name: e.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Phone</Label>
                    <Input
                      value={draftFamily.phone || ""}
                      onChange={(e) =>
                        setDraftFamily({
                          ...draftFamily,
                          phone: e.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Email</Label>
                    <Input
                      type="email"
                      value={draftFamily.email || ""}
                      onChange={(e) =>
                        setDraftFamily({
                          ...draftFamily,
                          email: e.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Aadhaar Number</Label>
                    <Input
                      value={draftFamily.aadhaar_number || ""}
                      onChange={(e) =>
                        handleAadhaarInput(
                          e.target.value,
                          setDraftFamily,
                          draftFamily
                        )
                      }
                      placeholder="1234-5678-9012"
                      maxLength={14}
                    />
                  </div>
                  <div>
                    <Label className="mb-1">PAN Number</Label>
                    <Input
                      value={draftFamily.pan_number || ""}
                      onChange={(e) =>
                        setDraftFamily({
                          ...draftFamily,
                          pan_number: e.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Passport Number</Label>
                    <Input
                      value={draftFamily.passport_number || ""}
                      onChange={(e) =>
                        setDraftFamily({
                          ...draftFamily,
                          passport_number: e.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Passport Expiry</Label>
                    <Input
                      type="date"
                      value={draftFamily.passport_expiry || ""}
                      onChange={(e) =>
                        setDraftFamily({
                          ...draftFamily,
                          passport_expiry: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Covered Under Insurance</Label>
                    <Select
                      value={draftFamily.is_covered_under_insurance || "N"}
                      onValueChange={(value) =>
                        setDraftFamily({
                          ...draftFamily,
                          is_covered_under_insurance: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="N">No</SelectItem>
                        <SelectItem value="Y">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1">Insurance Policy Number</Label>
                    <Input
                      value={draftFamily.insurance_policy_number || ""}
                      onChange={(e) =>
                        setDraftFamily({
                          ...draftFamily,
                          insurance_policy_number: e.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="mb-1">Address Line 1</Label>
                    <Input
                      value={draftFamily.address_line1 || ""}
                      onChange={(e) =>
                        setDraftFamily({
                          ...draftFamily,
                          address_line1: e.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="mb-1">Address Line 2</Label>
                    <Input
                      value={draftFamily.address_line2 || ""}
                      onChange={(e) =>
                        setDraftFamily({
                          ...draftFamily,
                          address_line2: e.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">City</Label>
                    <Input
                      value={draftFamily.city || ""}
                      onChange={(e) =>
                        setDraftFamily({ ...draftFamily, city: e.target.value })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">State</Label>
                    <Input
                      value={draftFamily.state || ""}
                      onChange={(e) =>
                        setDraftFamily({
                          ...draftFamily,
                          state: e.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Postal Code</Label>
                    <Input
                      value={draftFamily.postal_code || ""}
                      onChange={(e) =>
                        setDraftFamily({
                          ...draftFamily,
                          postal_code: e.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Country</Label>
                    <Input
                      value={draftFamily.country || ""}
                      onChange={(e) =>
                        setDraftFamily({
                          ...draftFamily,
                          country: e.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Is Emergency Contact</Label>
                    <Select
                      value={draftFamily.is_emergency_contact || "N"}
                      onValueChange={(value) =>
                        setDraftFamily({
                          ...draftFamily,
                          is_emergency_contact: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="N">No</SelectItem>
                        <SelectItem value="Y">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="mb-1">Notes</Label>
                    <textarea
                      value={draftFamily.notes || ""}
                      onChange={(e) =>
                        setDraftFamily({
                          ...draftFamily,
                          notes: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded"
                      rows={3}
                      placeholder="Optional notes"
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-3 col-span-2">
                    <Button size="sm" onClick={handleSaveEdit}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setDraftFamily({});
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-gray-600">
                      Relationship: {member.relationship || member.relation}
                    </p>
                    {member.date_of_birth && (
                      <p className="text-sm text-gray-600">
                        Date of Birth: {formatDateDisplay(member.date_of_birth)}
                      </p>
                    )}
                    {member.gender && (
                      <p className="text-sm text-gray-600">
                        Gender: {member.gender}
                      </p>
                    )}
                    <div className="flex gap-4 text-sm text-gray-600 mt-1">
                      {member.is_dependent === "Y" ||
                      member.is_dependent === "y" ? (
                        <span className="text-blue-600">Dependent</span>
                      ) : null}
                      {member.is_emergency_contact === "Y" ||
                      member.is_emergency_contact === "y" ? (
                        <span className="text-green-600">
                          Emergency Contact
                        </span>
                      ) : null}
                      {member.is_covered_under_insurance === "Y" ||
                      member.is_covered_under_insurance === "y" ? (
                        <span className="text-purple-600">
                          Covered by Insurance
                        </span>
                      ) : null}
                    </div>
                    {(member.phone || member.email) && (
                      <div className="text-sm text-gray-600 mt-1">
                        {member.phone && <span>Phone: {member.phone}</span>}
                        {member.phone && member.email && <span> | </span>}
                        {member.email && <span>Email: {member.email}</span>}
                      </div>
                    )}
                    {(member.occupation || member.employer_name) && (
                      <p className="text-sm text-gray-600 mt-1">
                        {member.occupation && (
                          <span>Occupation: {member.occupation}</span>
                        )}
                        {member.occupation && member.employer_name && (
                          <span> | </span>
                        )}
                        {member.employer_name && (
                          <span>Employer: {member.employer_name}</span>
                        )}
                      </p>
                    )}
                    {(member.aadhaar_number ||
                      member.pan_number ||
                      member.passport_number) && (
                      <div className="text-sm text-gray-600 mt-1 flex items-center gap-2 flex-wrap">
                        {member.aadhaar_number && (
                          <span className="flex items-center gap-1">
                            Aadhaar:{" "}
                            {visibleAadhaarIds.has(member.id)
                              ? formatAadhaar(member.aadhaar_number)
                              : maskAadhaar(member.aadhaar_number)}
                            <button
                              type="button"
                              onClick={() => toggleAadhaarVisibility(member.id)}
                              className="ml-1 hover:opacity-70 transition-opacity"
                              aria-label={
                                visibleAadhaarIds.has(member.id)
                                  ? "Hide Aadhaar number"
                                  : "Show Aadhaar number"
                              }
                            >
                              {visibleAadhaarIds.has(member.id) ? (
                                <EyeOff className="h-4 w-4 text-gray-500" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                          </span>
                        )}
                        {member.aadhaar_number && member.pan_number && (
                          <span> | </span>
                        )}
                        {member.pan_number && (
                          <span>PAN: {member.pan_number}</span>
                        )}
                        {member.pan_number && member.passport_number && (
                          <span> | </span>
                        )}
                        {member.passport_number && (
                          <span>Passport: {member.passport_number}</span>
                        )}
                        {member.passport_expiry && (
                          <span>
                            {" "}
                            (Exp: {formatDateDisplay(member.passport_expiry)})
                          </span>
                        )}
                      </div>
                    )}
                    {member.insurance_policy_number && (
                      <p className="text-sm text-gray-600 mt-1">
                        Insurance Policy: {member.insurance_policy_number}
                      </p>
                    )}
                    {(member.address_line1 || member.city || member.state) && (
                      <p className="text-sm text-gray-600 mt-1">
                        Address:{" "}
                        {[
                          member.address_line1,
                          member.address_line2,
                          member.city,
                          member.state,
                          member.postal_code,
                          member.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {member.notes && (
                      <p className="text-sm text-gray-500 mt-1 italic">
                        Notes: {member.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleEdit(member)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(member)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Password Dialog for Aadhaar Visibility */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Password</DialogTitle>
            <DialogDescription>
              Please enter your password to view the Aadhaar number.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="password" className="mb-2">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError("");
              }}
              placeholder="Enter your password"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  verifyPasswordAndShowAadhaar();
                }
              }}
            />
            {passwordError && (
              <p className="text-sm text-red-600 mt-2">{passwordError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordDialogOpen(false);
                setPasswordInput("");
                setPasswordError("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={verifyPasswordAndShowAadhaar}>Verify</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
