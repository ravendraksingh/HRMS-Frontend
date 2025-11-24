"use client";

import SearchEmployee from "@/components/common/SearchEmployee";
import SelectDepartment from "@/components/common/SelectDepartment";
import { useState } from "react";
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
import { toast } from "sonner";

const DemoPage = () => {
  // Example 1: Manager ID input
  const [managerId, setManagerId] = useState("");
  const [selectedManager, setSelectedManager] = useState(null);

  // Example 2: Employee ID input
  const [employeeId, setEmployeeId] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Example 3: Department selection
  const [selectedDepartment, setSelectedDepartment] = useState("");

  // Handle manager selection
  const handleManagerSelect = (empid, employee) => {
    if (empid) {
      setManagerId(empid);
      setSelectedManager(employee);
      toast.success(
        `Manager selected: ${
          employee?.employee_name || employee?.name || empid
        }`
      );
    } else {
      setManagerId("");
      setSelectedManager(null);
    }
  };

  // Handle employee selection
  const handleEmployeeSelect = (empid, employee) => {
    if (empid) {
      setEmployeeId(empid);
      setSelectedEmployee(employee);
      toast.success(
        `Employee selected: ${
          employee?.employee_name || employee?.name || empid
        }`
      );
    } else {
      setEmployeeId("");
      setSelectedEmployee(null);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!managerId) {
      toast.error("Please select a manager");
      return;
    }
    toast.success(`Form submitted with Manager ID: ${managerId}`);
    console.log("Form data:", { managerId, employeeId });
  };

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          SearchEmployee Component Demo
        </h1>
        <p className="text-gray-600">
          Examples of using SearchEmployee to populate input fields
        </p>
      </div>

      {/* Example 1: Manager Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Example 1: Manager Selection</CardTitle>
          <CardDescription>
            Search and select a manager. The selected manager ID will be set in
            the input field below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <SearchEmployee
              onSelect={handleManagerSelect}
              label="Search Manager"
              placeholder="Search by name or employee ID..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager-id">Manager ID (Auto-filled)</Label>
            <Input
              id="manager-id"
              type="text"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              placeholder="Manager ID will appear here after selection"
              readOnly
              className="bg-gray-50"
            />
            {selectedManager && (
              <div className="text-sm text-gray-600 mt-1">
                Selected:{" "}
                {selectedManager.employee_name || selectedManager.name || "N/A"}
                (ID:{" "}
                {selectedManager.empid ||
                  selectedManager.employee_id ||
                  selectedManager.id}
                )
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Example 2: Employee Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Example 2: Employee Selection</CardTitle>
          <CardDescription>
            Search and select an employee. The selected employee ID will be set
            in the input field.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <SearchEmployee
              onSelect={handleEmployeeSelect}
              label="Search Employee"
              placeholder="Search by name or employee ID..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee-id">Employee ID (Auto-filled)</Label>
            <Input
              id="employee-id"
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="Employee ID will appear here after selection"
              readOnly
              className="bg-gray-50"
            />
            {selectedEmployee && (
              <div className="text-sm text-gray-600 mt-1">
                Selected:{" "}
                {selectedEmployee.employee_name ||
                  selectedEmployee.name ||
                  "N/A"}
                (ID:{" "}
                {selectedEmployee.empid ||
                  selectedEmployee.employee_id ||
                  selectedEmployee.id}
                )
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Example 3: Form with Manager Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Example 3: Complete Form Example</CardTitle>
          <CardDescription>
            A complete form example where manager selection is required before
            submission.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="form-manager-id">Manager ID *</Label>
              <div className="space-y-2">
                <SearchEmployee
                  onSelect={handleManagerSelect}
                  label=""
                  showLabel={false}
                  placeholder="Search and select a manager..."
                />
                <Input
                  id="form-manager-id"
                  type="text"
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  placeholder="Manager ID (required)"
                  required
                  className="bg-gray-50"
                />
              </div>
              <p className="text-xs text-gray-500">
                Use the search above to find and select a manager, or enter the
                ID manually.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="form-notes">Notes</Label>
              <Input
                id="form-notes"
                type="text"
                placeholder="Additional notes..."
              />
            </div>

            <Button type="submit" disabled={!managerId}>
              Submit Form
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold mb-1">1. Import the component:</h4>
              <code className="block bg-gray-100 p-2 rounded text-xs">
                import SearchEmployee from "@/components/common/SearchEmployee";
              </code>
            </div>
            <div>
              <h4 className="font-semibold mb-1">
                2. Create state for the employee ID:
              </h4>
              <code className="block bg-gray-100 p-2 rounded text-xs">
                const [managerId, setManagerId] = useState("");
              </code>
            </div>
            <div>
              <h4 className="font-semibold mb-1">
                3. Create handler function:
              </h4>
              <code className="block bg-gray-100 p-2 rounded text-xs whitespace-pre">
                {`const handleManagerSelect = (empid, employee) => {
  if (empid) {
    setManagerId(empid);
    // employee object contains full employee data
  }
};`}
              </code>
            </div>
            <div>
              <h4 className="font-semibold mb-1">4. Use the component:</h4>
              <code className="block bg-gray-100 p-2 rounded text-xs">
                &lt;SearchEmployee onSelect={handleManagerSelect} /&gt;
              </code>
            </div>
            <div>
              <h4 className="font-semibold mb-1">
                5. Display the selected ID in an input:
              </h4>
              <code className="block bg-gray-100 p-2 rounded text-xs">
                &lt;Input value={managerId} readOnly /&gt;
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Example 4: SelectDepartment Component */}
      <Card>
        <CardHeader>
          <CardTitle>Example 4: SelectDepartment Component</CardTitle>
          <CardDescription>
            Examples of using SelectDepartment to select departments in forms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-semibold">Basic Usage (Required Field)</h4>
            <SelectDepartment
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
              label="Department"
              placeholder="Select a department"
              required
              showShortName={true}
            />
            {selectedDepartment && (
              <div className="text-sm text-gray-600 mt-2">
                Selected Department ID: {selectedDepartment}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">
              With "None" Option (Optional Field)
            </h4>
            <SelectDepartment
              value={selectedDepartment2}
              onValueChange={setSelectedDepartment2}
              label="Department (Optional)"
              placeholder="Select a department"
              allowNone={true}
              showShortName={true}
            />
            {selectedDepartment2 && (
              <div className="text-sm text-gray-600 mt-2">
                Selected Department ID: {selectedDepartment2}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoPage;
