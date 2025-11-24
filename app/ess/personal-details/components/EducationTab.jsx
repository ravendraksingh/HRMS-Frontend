"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import { formatDateDisplay } from "@/lib/formatDateDisplay";
import { normalizeDateForInput } from "./utils";

// Education Tab Component
export default function EducationTab({ employeeId, education, onUpdate }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newEducation, setNewEducation] = useState({
    qualification_type: "",
    degree: "",
    specialization: "",
    institution_name: "",
    university_board: "",
    start_date: "",
    end_date: "",
    percentage: "",
    cgpa: "",
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
        qualification_type: "",
        degree: "",
        specialization: "",
        institution_name: "",
        university_board: "",
        start_date: "",
        end_date: "",
        percentage: "",
        cgpa: "",
        grade: "",
      });
      onUpdate();
    } catch (error) {
      // New format: { "error": "...", "status": 404, "path": "...", "method": "..." }
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to add education";
      toast.error(errorMessage);
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
      // New format: { "error": "...", "status": 404, "path": "...", "method": "..." }
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to update education";
      toast.error(errorMessage);
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
      // New format: { "error": "...", "status": 404, "path": "...", "method": "..." }
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to delete education";
      toast.error(errorMessage);
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
        <div className="border rounded p-4 mb-4">
          <h3 className="font-semibold mb-3">Add Education</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1">Qualification Type</Label>
              <Input
                value={newEducation.qualification_type}
                onChange={(e) =>
                  setNewEducation({
                    ...newEducation,
                    qualification_type: e.target.value,
                  })
                }
                placeholder="e.g., 10th, 12th, Bachelor's, Master's"
              />
            </div>
            <div>
              <Label className="mb-1">Degree</Label>
              <Input
                value={newEducation.degree}
                onChange={(e) =>
                  setNewEducation({ ...newEducation, degree: e.target.value })
                }
                placeholder="e.g., B.Tech, M.Sc"
              />
            </div>
            <div>
              <Label className="mb-1">Specialization</Label>
              <Input
                value={newEducation.specialization}
                onChange={(e) =>
                  setNewEducation({
                    ...newEducation,
                    specialization: e.target.value,
                  })
                }
                placeholder="e.g., Computer Science, PCM"
              />
            </div>
            <div>
              <Label className="mb-1">Institution Name</Label>
              <Input
                value={newEducation.institution_name}
                onChange={(e) =>
                  setNewEducation({
                    ...newEducation,
                    institution_name: e.target.value,
                  })
                }
                placeholder="e.g., Govt Inter College"
              />
            </div>
            <div>
              <Label className="mb-1">University/Board</Label>
              <Input
                value={newEducation.university_board}
                onChange={(e) =>
                  setNewEducation({
                    ...newEducation,
                    university_board: e.target.value,
                  })
                }
                placeholder="e.g., UP Board, Delhi University"
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
              <Label className="mb-1">Percentage</Label>
              <Input
                type="number"
                step="0.01"
                value={newEducation.percentage}
                onChange={(e) =>
                  setNewEducation({
                    ...newEducation,
                    percentage: e.target.value,
                  })
                }
                placeholder="e.g., 85.5"
              />
            </div>
            <div>
              <Label className="mb-1">CGPA</Label>
              <Input
                type="number"
                step="0.01"
                value={newEducation.cgpa}
                onChange={(e) =>
                  setNewEducation({ ...newEducation, cgpa: e.target.value })
                }
                placeholder="e.g., 8.5"
              />
            </div>
            <div>
              <Label className="mb-1">Grade</Label>
              <Input
                value={newEducation.grade}
                onChange={(e) =>
                  setNewEducation({ ...newEducation, grade: e.target.value })
                }
                placeholder="e.g., A, B+, First Class"
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
                    <Label className="mb-1">Qualification Type</Label>
                    <Input
                      value={draftEducation.qualification_type || ""}
                      onChange={(e) =>
                        setDraftEducation({
                          ...draftEducation,
                          qualification_type: e.target.value,
                        })
                      }
                    />
                  </div>
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
                    <Label className="mb-1">Specialization</Label>
                    <Input
                      value={draftEducation.specialization || ""}
                      onChange={(e) =>
                        setDraftEducation({
                          ...draftEducation,
                          specialization: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Institution Name</Label>
                    <Input
                      value={draftEducation.institution_name || ""}
                      onChange={(e) =>
                        setDraftEducation({
                          ...draftEducation,
                          institution_name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-1">University/Board</Label>
                    <Input
                      value={draftEducation.university_board || ""}
                      onChange={(e) =>
                        setDraftEducation({
                          ...draftEducation,
                          university_board: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Start Date</Label>
                    <Input
                      type="date"
                      value={
                        draftEducation.start_date
                          ? normalizeDateForInput(draftEducation.start_date)
                          : ""
                      }
                      onChange={(e) =>
                        setDraftEducation({
                          ...draftEducation,
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
                        draftEducation.end_date
                          ? normalizeDateForInput(draftEducation.end_date)
                          : ""
                      }
                      onChange={(e) =>
                        setDraftEducation({
                          ...draftEducation,
                          end_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Percentage</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={draftEducation.percentage || ""}
                      onChange={(e) =>
                        setDraftEducation({
                          ...draftEducation,
                          percentage: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-1">CGPA</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={draftEducation.cgpa || ""}
                      onChange={(e) =>
                        setDraftEducation({
                          ...draftEducation,
                          cgpa: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Grade</Label>
                    <Input
                      value={draftEducation.grade || ""}
                      onChange={(e) =>
                        setDraftEducation({
                          ...draftEducation,
                          grade: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex gap-2 mt-3 col-span-2">
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
                    <h3 className="font-semibold">
                      {edu.qualification_type || edu.degree}
                    </h3>
                    {edu.degree && (
                      <p className="text-sm text-gray-600">
                        Degree: {edu.degree}
                      </p>
                    )}
                    {edu.specialization && (
                      <p className="text-sm text-gray-600">
                        Specialization: {edu.specialization}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      {edu.institution_name || "N/A"}
                    </p>
                    {edu.university_board && (
                      <p className="text-sm text-gray-600">
                        Board/University: {edu.university_board}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      {edu.start_date
                        ? formatDateDisplay(edu.start_date)
                        : "N/A"}{" "}
                      -{" "}
                      {edu.end_date
                        ? formatDateDisplay(edu.end_date)
                        : "Present"}
                    </p>
                    <div className="flex gap-4 text-sm text-gray-600 mt-1">
                      {edu.percentage && (
                        <span>Percentage: {edu.percentage}%</span>
                      )}
                      {edu.cgpa && <span>CGPA: {edu.cgpa}</span>}
                      {edu.grade && <span>Grade: {edu.grade}</span>}
                    </div>
                    <div className="mt-2">
                      {edu.is_verified === "Y" || edu.is_verified === "y" ? (
                        <div className="text-sm">
                          <p className="text-green-600 font-medium">
                            ✓ Verified
                          </p>
                          {edu.verified_by_name && (
                            <p className="text-gray-600 mt-1">
                              Verified by: {edu.verified_by_name}
                              {edu.verified_by_email &&
                                ` (${edu.verified_by_email})`}
                            </p>
                          )}
                          {edu.verified_at && (
                            <p className="text-gray-600">
                              Verified on: {formatDateDisplay(edu.verified_at)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Not Verified</p>
                      )}
                    </div>
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
