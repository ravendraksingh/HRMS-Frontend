"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import { formatDateDisplay } from "@/lib/formatDateDisplay";

// Employment History Tab Component
export default function EmploymentHistoryTab({ employeeId, history, onUpdate }) {
  const [adding, setAdding] = useState(false);
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
              <textarea
                value={newHistory.job_description}
                onChange={(e) =>
                  setNewHistory({
                    ...newHistory,
                    job_description: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
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
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
