import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";

const DailyTeamSummary = () => {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:justify-between">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Present Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row justify-between gap-1">
            <div>
              <Label className="text-muted-foreground">On time</Label>
              <p className="text-2xl font-bold">133</p>
            </div>
            <div>
              <Label className="text-red-500">Late clock-in</Label>
              <p className="text-2xl font-bold">45</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Early clock-in</Label>
              <p className="text-2xl font-bold">18</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Not Present Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row justify-between gap-1">
            <div>
              <Label className="text-muted-foreground">Absent</Label>
              <p className="text-2xl font-bold">23</p>
            </div>
            <div>
              <Label className="text-red-500">No clock-in</Label>
              <p className="text-2xl font-bold">18</p>
            </div>
            <div>
              <Label className="text-muted-foreground">No clock-out</Label>
              <p className="text-2xl font-bold">8</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Invalid</Label>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="w-full md:max-w-sm">
        <CardHeader>
          <CardTitle>Away Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row justify-between gap-1">
            <div>
              <Label className="text-muted-foreground">Day off</Label>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div>
              <Label className="text-red-500">Time off</Label>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyTeamSummary;
