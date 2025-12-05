import React from "react";
import DataTable from "./DataTable";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { formatTime24Hour } from "@/lib/dateTimeUtil";

const columns = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "empid",
    accessorKey: "empid",
    header: "Employee Id",
    cell: ({ row }) => <div className="">{row.getValue("empid")}</div>,
    enableHiding: false,
    enableFilter: true,
    filterFn: "includesString",
    enableSorting: true,
  },
  {
    id: "name",
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
    enableHiding: false,
    enableFilter: true,
    filterFn: "includesString",
    enableSorting: true,
  },
  {
    id: "email",
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div>{row.getValue("email")}</div>,
    enableSorting: false,
  },
  {
    id: "department_id",
    accessorKey: "department_id",
    header: "Department",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("department_id")}</div>
    ),
  },
  {
    id: "location_name",
    accessorKey: "location_name",
    header: "Location",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("location_name")}</div>
    ),
    enableSorting: true,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const employee = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(employee.id)}
            >
              Copy email id
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>View more details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

const EmployeesTable = ({ data }) => {
  console.log("EmployeesTable", data);
  return <DataTable columns={columns} data={data} />;
};

export default EmployeesTable;
