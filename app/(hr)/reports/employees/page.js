"use client";

import { useState, useEffect } from "react";
import EmployeeCard from "@/components/employees/EmployeeCard";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getPagination } from "@/lib/emsUtil";
import {
  Select,
  SelectTrigger,
  SelectLabel,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmployeesTable } from "@/components/data-table/EmpTable";
import apiClient from "@/app/services/internalApiClient";
import { externalApiClient } from "@/app/services/externalApiClient";

const EmployeesPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Convert searchParams to a plain object for easy manipulation
  const currentQuery = {};
  searchParams.forEach((value, key) => {
    currentQuery[key] = value;
  });

  // Filter state
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);

  const [selectedDept, setSelectedDept] = useState(
    searchParams.get("department") || ""
  );
  const [selectedManager, setSelectedManager] = useState(
    searchParams.get("manager_id") || ""
  );
  const [searchName, setSearchName] = useState(searchParams.get("name") || "");
  const page = searchParams.get("page") || "1";
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const paginationItems = getPagination(
    pagination?.currentPage,
    pagination?.totalPages
  );
  // new filteredManagers state
  const [filteredManagers, setFilteredManagers] = useState([]);

  // Fetch filter data: departments & managers (on mount)
  useEffect(() => {
    async function fetchFilters() {
      try {
        const [deptRes, mgrRes] = await Promise.all([
          externalApiClient.get("/departments"),
          externalApiClient.get("/managers"),
        ]);

        const deptData = deptRes.data.departments;
        setDepartments(deptData);

        const mgrData = mgrRes.data.managers;
        setManagers(mgrData);
      } catch (err) {
        console.log(err);
      }
    }
    fetchFilters();
  }, []);

  // Filter form handler
  const handleFilter = () => {
    console.log("handleFilter called");
    let query = [];
    if (selectedDept && selectedDept !== "all")
      query.push(`department=${selectedDept}`);
    if (selectedManager && selectedManager !== "all")
      query.push(`manager_id=${selectedManager}`);
    if (searchName) query.push(`name=${encodeURIComponent(searchName)}`);
    query.push("page=1"); // Always reset
    router.push(`/admin/employees?${query.join("&")}`);
  };

  useEffect(() => {
    async function fetchAllEmployees() {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", "10");
      if (searchParams.get("department"))
        params.set("department", searchParams.get("department"));
      if (searchParams.get("manager_id"))
        params.set("manager_id", searchParams.get("manager_id"));
      if (searchParams.get("name"))
        params.set("name", searchParams.get("name"));

      let url = `/employees?${params.toString()}`;

      try {
        // const res = await fetch(url);
        // const res = await apiClient.get(
        //   `/admin/employees?${params.toString()}`
        // );
        const res = await externalApiClient.get("/admin/employees");
        const data = res.data.employees;
        setEmployees(data);
        setPagination(res.data.pagination || {});
      } catch (error) {
        console.error("Failed fetching employees:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAllEmployees();
  }, [searchParams]);

  const handleDeptChange = (value) => {
    setSelectedDept(value);
    console.log("selectedDept", value);
  };

  const handleManagerChange = (value) => {
    setSelectedManager(value);
    console.log("selectedManager", value);
  };

  // Filter managers whenever selectedDept or managers changes
  useEffect(() => {
    if (!selectedDept) {
      setFilteredManagers(managers); // Or set to [] if you prefer
    } else {
      setFilteredManagers(
        managers.filter((m) => m.department === selectedDept)
      );
    }
    // Optionally reset manager selection if selected manager not in filtered
    if (
      selectedManager &&
      !managers.some(
        (m) => m.department === selectedDept && m.emp_id === selectedManager
      )
    ) {
      setSelectedManager("");
    }
  }, [selectedDept, managers]);

  return (
    <div className="container mx-auto mb-[50px]">
      <div className="flex gap-2 my-4 justify-center">
        {/* Department Dropdown */}
        <Select onValueChange={handleDeptChange} value={selectedDept}>
          <SelectTrigger>
            <SelectValue placeholder="Seelct a Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Departments</SelectLabel>
              <SelectItem value="all">All Dept</SelectItem>
              {departments?.map((d) => (
                <SelectItem value={d.id} key={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Manager Dropdown */}
        <Select onValueChange={handleManagerChange} value={selectedManager}>
          <SelectTrigger>
            <SelectValue placeholder="Seelct a Manager" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Managers</SelectLabel>
              <SelectItem value="all">All Managers</SelectItem>
              {filteredManagers.length === 0 && (
                <SelectItem disabled>No managers found</SelectItem>
              )}
              {filteredManagers.map((m, index) => (
                <SelectItem value={m.employee_id} key={m.id}>
                  {m.employee_id}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Name Search */}
        <Input
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          placeholder="Search name"
          className="max-w-60"
        />
        <Button onClick={handleFilter} className="hover:cursor-pointer">
          Filter
        </Button>
      </div>
      {/* Loading Spinner */}
      {loading && (
        <div className="flex justify-center mt-25">
          <p>Loading...</p>
          <Spinner />
        </div>
      )}
      {/* <div className="flex justify-center gap-2 my-5">
        {pagination.hasPreviousPage && (
          <button
            onClick={() =>
              router.push(`/api/employees?page=${Number(page) - 1}`)
            }
            className="px-4 py-2 bg-gray-200 rounded hover:cursor-pointer"
          >
            Previous
          </button>
        )}
        {pagination.hasNextPage && (
          <button
            onClick={() =>
              router.push(router.push(`/employees?page=${Number(page) + 1}`))
            }
            className="px-4 py-2 bg-gray-200 rounded hover:cursor-pointer"
          >
            Next
          </button>
        )}
      </div> */}

      <div>
        <EmployeesTable data={employees} />
      </div>
      <div className="flex gap-2 justify-center">
        {paginationItems.map((item, idx) =>
          typeof item === "number" ? (
            <button
              key={item}
              className={`px-2 py-1 rounded hover:cursor-pointer ${
                item === pagination.currentPage
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
              //   onClick={() => router.push(`/employees?page=${item}`)}
              onClick={() => {
                // Copy current filters and update page
                const newQuery = { ...currentQuery, page: item.toString() };
                // Create query string from object
                const params = new URLSearchParams(newQuery).toString();
                router.push(`${pathname}?${params}`);
              }}
            >
              {item}
            </button>
          ) : (
            <span key={`dots-${idx}`} className="px-2 py-1">
              ...
            </span>
          )
        )}
      </div>
    </div>
  );
};

export default EmployeesPage;
