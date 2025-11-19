"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import DataTable from "./DataTable";
import { formatDate, formatTime } from "@/lib/dateTimeUtil";

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
    id: "employee_id",
    accessorKey: "employee_id",
    header: "Employee Id",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("employee_id")}</div>
    ),
    enableHiding: false,
    enableFilter: true,
    filterFn: "includesString",
  },
  {
    id: "date",
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <div className="capitalize">{row.getValue("date")}</div>,
    enableHiding: false,
    enableFilter: true,
    filterFn: "includesString",
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("status")}</div>
    ),
  },
  {
    id: "clockin_time",
    accessorKey: "clockin_time",
    header: "Clock-in",
    cell: ({ row }) => (
      <div className="capitalize">
        {formatTime(row.getValue("clockin_time"))}
      </div>
    ),
  },
  {
    id: "clockout_time",
    accessorKey: "clockout_time",
    header: "Clock-out",
    cell: ({ row }) => (
      <div className="capitalize">
        {formatTime(row.getValue("clockout_time"))}
      </div>
    ),
  },
  //   {
  //     accessorKey: "email",
  //     header: ({ column }) => (
  //       <Button
  //         variant="ghost"
  //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //       >
  //         Email
  //         <ArrowUpDown />
  //       </Button>
  //     ),
  //     cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  //   },
  {
    id: "approver_id",
    accessorKey: "approver_id",
    header: "Approver Id",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("approver_id")}</div>
    ),
  },
  {
    id: "approved",
    accessorKey: "approved",
    header: "Approved",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("approved")}</div>
    ),
    enableFilter: true,
  },
  {
    id: "approver_remarks",
    accessorKey: "approver_remarks",
    header: "Approver Remarks",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("approver_remarks")}</div>
    ),
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

const AttendanceTable = ({ data }) => {
  return <DataTable columns={columns} data={data} />;
};

export default AttendanceTable;
