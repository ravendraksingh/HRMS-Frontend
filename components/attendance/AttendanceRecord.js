import React from "react";

const AttendanceRecord = ({ record }) => {
  console.log("AttendanceRecord. record", record);

  return (
    <div className="flex flex-row flex-wrap">
      <div>{record?.today_date}</div>
      <div>{record?.clockin_time}</div>
      <div>{record?.clockout_time}</div>
      <div>{record?.approved==="Y" ? "Yes" : "No"}</div>
      <div>{record?.approver_id}</div>
      <div>{record?.approved_at}</div>
      <div>{record?.approver_remakrs}</div>
    </div>
  );
};

export default AttendanceRecord;
