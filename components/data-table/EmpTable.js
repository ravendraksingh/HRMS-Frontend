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
    accessorKey: "id",
    header: "Employee Id",
    cell: ({ row }) => <div className="capitalize">{row.getValue("id")}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    enableFilter: true,
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("department")}</div>
    ),
    enableFilter: true,
  },
  {
    accessorKey: "manager_id",
    header: "Manager Id",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("manager_id")}</div>
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

export function EmployeesTable({ data }) {
  console.log(data);
  return <DataTable columns={columns} data={data} />;
  //   const [sorting, setSorting] = React.useState([]);
  //   const [columnFilters, setColumnFilters] = React.useState([]);
  //   const [columnVisibility, setColumnVisibility] = React.useState({});
  //   const [rowSelection, setRowSelection] = React.useState({});
  //   const [pagination, setPagination] = React.useState({
  //     pageIndex: 0,
  //     pageSize: 10,
  //   });

  //   const table = useReactTable({
  //     data,
  //     columns,
  //     onSortingChange: setSorting,
  //     onColumnFiltersChange: setColumnFilters,
  //     getCoreRowModel: getCoreRowModel(),
  //     getPaginationRowModel: getPaginationRowModel(),
  //     getSortedRowModel: getSortedRowModel(),
  //     getFilteredRowModel: getFilteredRowModel(),
  //     onColumnVisibilityChange: setColumnVisibility,
  //     onRowSelectionChange: setRowSelection,
  //     onPaginationChange: setPagination, // Handler to update pagination state
  //     state: {
  //       sorting,
  //       columnFilters,
  //       columnVisibility,
  //       rowSelection,
  //       pagination,
  //     },
  //   });

  // //   return (
  //     <div className="w-full">
  //       <div className="flex gap-4 items-center py-4">
  //         <Input
  //           placeholder="Filter name..."
  //           value={table.getColumn("name")?.getFilterValue() ?? ""}
  //           onChange={(event) =>
  //             table.getColumn("name")?.setFilterValue(event.target.value)
  //           }
  //           className="max-w-sm"
  //         />
  //         <Input
  //           placeholder="Filter emails..."
  //           value={table.getColumn("email")?.getFilterValue() ?? ""}
  //           onChange={(event) =>
  //             table.getColumn("email")?.setFilterValue(event.target.value)
  //           }
  //           className="max-w-sm"
  //         />
  //         <Input
  //           placeholder="Filter dept..."
  //           value={table.getColumn("department")?.getFilterValue() ?? ""}
  //           onChange={(event) =>
  //             table.getColumn("department")?.setFilterValue(event.target.value)
  //           }
  //           className="max-w-sm"
  //         />

  //         <DropdownMenu>
  //           <DropdownMenuTrigger asChild>
  //             <Button variant="outline" className="ml-auto">
  //               Columns <ChevronDown />
  //             </Button>
  //           </DropdownMenuTrigger>
  //           <DropdownMenuContent align="end">
  //             {table
  //               .getAllColumns()
  //               .filter((column) => column.getCanHide())
  //               .map((column) => (
  //                 <DropdownMenuCheckboxItem
  //                   key={column.id}
  //                   className="capitalize"
  //                   checked={column.getIsVisible()}
  //                   onCheckedChange={(value) => column.toggleVisibility(!!value)}
  //                 >
  //                   {column.id}
  //                 </DropdownMenuCheckboxItem>
  //               ))}
  //           </DropdownMenuContent>
  //         </DropdownMenu>
  //       </div>
  //       <div className="overflow-hidden rounded-md border">
  //         <Table>
  //           <TableHeader>
  //             {table.getHeaderGroups().map((headerGroup) => (
  //               <TableRow key={headerGroup.id}>
  //                 {headerGroup.headers.map((header) => (
  //                   <TableHead key={header.id}>
  //                     {header.isPlaceholder
  //                       ? null
  //                       : flexRender(
  //                           header.column.columnDef.header,
  //                           header.getContext()
  //                         )}
  //                   </TableHead>
  //                 ))}
  //               </TableRow>
  //             ))}
  //           </TableHeader>
  //           <TableBody>
  //             {table.getRowModel().rows?.length ? (
  //               table.getRowModel().rows.map((row) => (
  //                 <TableRow
  //                   key={row.id}
  //                   data-state={row.getIsSelected() && "selected"}
  //                 >
  //                   {row.getVisibleCells().map((cell) => (
  //                     <TableCell key={cell.id}>
  //                       {flexRender(
  //                         cell.column.columnDef.cell,
  //                         cell.getContext()
  //                       )}
  //                     </TableCell>
  //                   ))}
  //                 </TableRow>
  //               ))
  //             ) : (
  //               <TableRow>
  //                 <TableCell
  //                   colSpan={columns.length}
  //                   className="h-24 text-center"
  //                 >
  //                   No results.
  //                 </TableCell>
  //               </TableRow>
  //             )}
  //           </TableBody>
  //         </Table>
  //       </div>
  //       <div className="flex items-center justify-end space-x-2 py-4">
  //         <div className="text-muted-foreground flex-1 text-sm">
  //           {table.getFilteredSelectedRowModel().rows.length} of{" "}
  //           {table.getFilteredRowModel().rows.length} row(s) selected.
  //         </div>

  //         <div className="space-x-2 flex flex-1 justify-end items-center">
  //           <Button
  //             // variant="outline"
  //             size="sm"
  //             onClick={() => table.previousPage()}
  //             disabled={!table.getCanPreviousPage()}
  //           >
  //             Previous
  //           </Button>
  //           <div className="text-sm font-medium text-muted-foreground">
  //             Page {pagination.pageIndex + 1} of {table.getPageCount()}
  //           </div>
  //           <Button
  //             // variant="secondary"
  //             size="sm"
  //             onClick={() => table.nextPage()}
  //             disabled={!table.getCanNextPage()}
  //           >
  //             Next
  //           </Button>
  //         </div>
  //       </div>
  //     </div>
  //   );
}
