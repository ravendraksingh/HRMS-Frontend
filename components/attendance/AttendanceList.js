import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { formatDate, formatTime } from "@/lib/dateTimeUtil";

const AttendanceList = ({ data }) => {
  console.log("AttendanceList data:", data);

  return (
    <div className="pt-[30px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Emp Id</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Present</TableHead>
            <TableHead>Clock-in</TableHead>
            <TableHead>Clock-out</TableHead>
            <TableHead>Overtime</TableHead>
            <TableHead>Approver Id</TableHead>
            <TableHead>Approved</TableHead>
            <TableHead>Approver Remarks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data &&
            Array.isArray(data) &&
            data.length > 0 &&
            data.map((d, index) => (
              <TableRow key={"attend_" + index}>
                <TableCell>{d?.employee_id}</TableCell>
                <TableCell>
                  {formatDate(d?.date || "", "dd-MMM-yyyy")}
                </TableCell>
                <TableCell>{d?.present || ""}</TableCell>
                <TableCell>
                  {formatTime(d?.clockin_time || "", "hh:mm a")}
                </TableCell>
                <TableCell>
                  {formatTime(d?.clockout_time || "", "hh:mm a")}
                </TableCell>
                <TableCell></TableCell>
                <TableCell>{d?.approver_id || ""}</TableCell>
                <TableCell>{d?.approved || ""}</TableCell>
                <TableCell>{d?.approver_remarks || ""}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      {/* {data.map((record, index) => (
        <AttendanceRecord record={record} key={`attn-rec#` + index} />
      ))} */}
    </div>
  );
};

export default AttendanceList;
