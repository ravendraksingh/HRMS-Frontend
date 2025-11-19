import React from "react";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

const PersonalDetails = ({ employee }) => {
  return (
    <Card className="max-w-[800px]">
      <CardContent>
        <div className="mb-3">
          <Label className="mb-3">Employee Id</Label>
          <Input value={employee?.id || ""} disabled />
        </div>
        <div className="mb-3">
          <Label className="mb-3">Name</Label>
          <Input
            name="name"
            type="text"
            value={employee?.name || ""}
            disabled
          />
        </div>
        <div className="mb-3">
          <Label className="mb-3">Email</Label>
          <Input
            name="email"
            type="email"
            value={employee?.email || ""}
            disabled
          />
        </div>
        <div className="mb-3">
          <Label className="mb-3">Department</Label>
          <Input
            name="department"
            type="text"
            value={employee?.department || ""}
            disabled
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalDetails;
