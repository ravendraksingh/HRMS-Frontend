"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import { formatDateDisplay } from "@/lib/dateTimeUtil";
import { normalizeDateForInput } from "./utils";
import { CheckCircle2 } from "lucide-react";

// Employment History Tab Component
export default function EmploymentHistoryTab({ employeeId, history, onUpdate, isHRView = false }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [newHistory, setNewHistory] = useState({
    company_name: "",
    designation: "",
    start_date: "",
    end_date: "",
    job_description: "",
    reason_for_leaving: "",
    last_salary: "",
    supervisor_name: "",
    supervisor_contact: "",
  });
  const [draftHistory, setDraftHistory] = useState({
    company_name: "",
    designation: "",
    start_date: "",
    end_date: "",
    job_description: "",
    reason_for_leaving: "",
    last_salary: "",
    supervisor_name: "",
    supervisor_contact: "",
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
        designation: "",
        start_date: "",
        end_date: "",
        job_description: "",
        reason_for_leaving: "",
        last_salary: "",
        supervisor_name: "",
        supervisor_contact: "",
      });
      onUpdate();
    } catch (error) {
      // New format: { "error": "...", "status": 404, "path": "...", "method": "..." }
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to add employment history";
      toast.error(errorMessage);
    }
  };

  const handleEdit = async (h) => {
    try {
      await externalApiClient.patch(
        `/employees/${employeeId}/employment-history/${h.id}`,
        draftHistory
      );
      toast.success("Employment history updated successfully!");
      setEditingId(null);
      onUpdate();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to update employment history";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (h) => {
    if (!confirm("Are you sure you want to delete this employment history record?"))
      return;
    try {
      await externalApiClient.delete(
        `/employees/${employeeId}/employment-history/${h.id}`
      );
      toast.success("Employment history deleted successfully!");
      onUpdate();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to delete employment history";
      toast.error(errorMessage);
    }
  };

  const handleVerify = async (h) => {
    try {
      setVerifyingId(h.id);
      await externalApiClient.patch(
        `/employees/${employeeId}/employment-history/${h.id}`,
        { is_verified: "Y" }
      );
      toast.success("Employment history verified successfully!");
      onUpdate();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to verify employment history";
      toast.error(errorMessage);
    } finally {
      setVerifyingId(null);
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
        <div className="border rounded p-4 mb-4">
          <h3 className="font-semibold mb-3">Add Employment History</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1">Company Name</Label>
              <Input
                value={newHistory.company_name}
                onChange={(e) =>
                  setNewHistory({ ...newHistory, company_name: e.target.value })
                }
                placeholder="e.g., Infosys"
              />
            </div>
            <div>
              <Label className="mb-1">Designation</Label>
              <Input
                value={newHistory.designation}
                onChange={(e) =>
                  setNewHistory({ ...newHistory, designation: e.target.value })
                }
                placeholder="e.g., Software Engineer"
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
              <Label className="mb-1">Job Description</Label>
              <Textarea
                value={newHistory.job_description}
                onChange={(e) =>
                  setNewHistory({
                    ...newHistory,
                    job_description: e.target.value,
                  })
                }
                rows={3}
                placeholder="Describe your role and responsibilities"
              />
            </div>
            <div className="col-span-2">
              <Label className="mb-1">Reason for Leaving</Label>
              <Input
                value={newHistory.reason_for_leaving}
                onChange={(e) =>
                  setNewHistory({
                    ...newHistory,
                    reason_for_leaving: e.target.value,
                  })
                }
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="mb-1">Last Salary</Label>
              <Input
                type="number"
                value={newHistory.last_salary}
                onChange={(e) =>
                  setNewHistory({
                    ...newHistory,
                    last_salary: e.target.value,
                  })
                }
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="mb-1">Supervisor Name</Label>
              <Input
                value={newHistory.supervisor_name}
                onChange={(e) =>
                  setNewHistory({
                    ...newHistory,
                    supervisor_name: e.target.value,
                  })
                }
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="mb-1">Supervisor Contact</Label>
              <Input
                value={newHistory.supervisor_contact}
                onChange={(e) =>
                  setNewHistory({
                    ...newHistory,
                    supervisor_contact: e.target.value,
                  })
                }
                placeholder="Optional"
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
              {editingId === h.id ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1">Company Name</Label>
                    <Input
                      value={draftHistory.company_name || ""}
                      onChange={(e) =>
                        setDraftHistory({
                          ...draftHistory,
                          company_name: e.target.value,
                        })
                      }
                      placeholder="e.g., Infosys"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Designation</Label>
                    <Input
                      value={draftHistory.designation || ""}
                      onChange={(e) =>
                        setDraftHistory({
                          ...draftHistory,
                          designation: e.target.value,
                        })
                      }
                      placeholder="e.g., Software Engineer"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Start Date</Label>
                    <Input
                      type="date"
                      value={
                        draftHistory.start_date
                          ? normalizeDateForInput(draftHistory.start_date)
                          : ""
                      }
                      onChange={(e) =>
                        setDraftHistory({
                          ...draftHistory,
                          start_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-1">End Date</Label>
                    <Input
                      type="date"
                      value={
                        draftHistory.end_date
                          ? normalizeDateForInput(draftHistory.end_date)
                          : ""
                      }
                      onChange={(e) =>
                        setDraftHistory({
                          ...draftHistory,
                          end_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="mb-1">Job Description</Label>
                    <Textarea
                      value={draftHistory.job_description || ""}
                      onChange={(e) =>
                        setDraftHistory({
                          ...draftHistory,
                          job_description: e.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Describe your role and responsibilities"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="mb-1">Reason for Leaving</Label>
                    <Input
                      value={draftHistory.reason_for_leaving || ""}
                      onChange={(e) =>
                        setDraftHistory({
                          ...draftHistory,
                          reason_for_leaving: e.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Last Salary</Label>
                    <Input
                      type="number"
                      value={draftHistory.last_salary || ""}
                      onChange={(e) =>
                        setDraftHistory({
                          ...draftHistory,
                          last_salary: e.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Supervisor Name</Label>
                    <Input
                      value={draftHistory.supervisor_name || ""}
                      onChange={(e) =>
                        setDraftHistory({
                          ...draftHistory,
                          supervisor_name: e.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Supervisor Contact</Label>
                    <Input
                      value={draftHistory.supervisor_contact || ""}
                      onChange={(e) =>
                        setDraftHistory({
                          ...draftHistory,
                          supervisor_contact: e.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div className="flex gap-2 mt-3 col-span-2">
                    <Button size="sm" onClick={() => handleEdit(h)}>
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
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {h.designation || h.job_title} at {h.company_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {h.start_date ? formatDateDisplay(h.start_date) : "N/A"} -{" "}
                      {h.end_date ? formatDateDisplay(h.end_date) : "Present"}
                    </p>
                    {h.job_description && (
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Job Description:</strong> {h.job_description}
                      </p>
                    )}
                    {h.reason_for_leaving && (
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Reason for Leaving:</strong>{" "}
                        {h.reason_for_leaving}
                      </p>
                    )}
                    <div className="flex gap-4 text-sm text-gray-600 mt-1">
                      {h.last_salary && <span>Last Salary: {h.last_salary}</span>}
                      {h.supervisor_name && (
                        <span>Supervisor: {h.supervisor_name}</span>
                      )}
                      {h.supervisor_contact && (
                        <span>Contact: {h.supervisor_contact}</span>
                      )}
                    </div>
                    {h.is_verified === "Y" || h.is_verified === "y" ? (
                      <p className="text-sm text-green-600 mt-1">✓ Verified</p>
                    ) : (
                      <p className="text-sm text-gray-400 mt-1">Not Verified</p>
                    )}
                  </div>
                  <div className="ml-4 flex gap-2">
                    {isHRView && 
                     (h.is_verified !== "Y" && h.is_verified !== "y") && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleVerify(h)}
                        disabled={verifyingId === h.id}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {verifyingId === h.id ? "Verifying..." : "Verify"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingId(h.id);
                        setDraftHistory({
                          company_name: h.company_name || "",
                          designation: h.designation || h.job_title || "",
                          start_date: h.start_date
                            ? normalizeDateForInput(h.start_date)
                            : "",
                          end_date: h.end_date
                            ? normalizeDateForInput(h.end_date)
                            : "",
                          job_description: h.job_description || "",
                          reason_for_leaving: h.reason_for_leaving || "",
                          last_salary: h.last_salary || "",
                          supervisor_name: h.supervisor_name || "",
                          supervisor_contact: h.supervisor_contact || "",
                        });
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(h)}
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
