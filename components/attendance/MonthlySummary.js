import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MonthlySummary = ({ summary }) => {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex flex-nowrap">{summary.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div>{summary.month}</div>
        <div className="text-4xl font-black text-gray-500">{`${summary.percentage}`}</div>
      </CardContent>
    </Card>
  );
};

export default MonthlySummary;
