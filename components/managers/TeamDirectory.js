"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UsersRound, Building, MapPin, Search } from "lucide-react";
import { externalApiClient } from "@/app/services/externalApiClient";
import EmployeesTable from "@/components/data-table/EmployeesTable";

export default function TeamDirectory({ teamMembers }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMembers, setFilteredMembers] = useState(teamMembers || []);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);

//   console.log("team members in TeamDirectory", teamMembers);

  useEffect(() => {
    if (teamMembers) {
      filterMembers();
    }
  }, [searchQuery, teamMembers]);

  useEffect(() => {
    fetchDepartmentsAndLocations();
  }, []);

  const fetchDepartmentsAndLocations = async () => {
    try {
      const [deptRes, locRes] = await Promise.all([
        externalApiClient
          .get("/departments")
          .catch(() => ({ data: { departments: [] } })),
        externalApiClient
          .get("/locations")
          .catch(() => ({ data: { locations: [] } })),
      ]);

      setDepartments(deptRes.data?.departments || []);
      setLocations(locRes.data?.locations || []);
    } catch (error) {
      console.error("Error fetching departments/locations:", error);
    }
  };

  const filterMembers = () => {
    if (!searchQuery.trim()) {
      setFilteredMembers(teamMembers || []);
      return;
    }

    const query = searchQuery.toLowerCase();
    console.log("teamMembers", teamMembers);
    const filtered = (teamMembers || []).filter((member) => {
      const name = (member.name || "").toLowerCase();
      const email = (member.email || "").toLowerCase();
      const empid = (member.empid || "").toLowerCase();
      const dept = getDepartmentName(
        member.department_id || member.department
      ).toLowerCase();

      return (
        name.includes(query) ||
        email.includes(query) ||
        empid.includes(query) ||
        dept.includes(query)
      );
    });

    setFilteredMembers(filtered);
  };

  const getDepartmentName = (deptId) => {
    if (!deptId) return "N/A";
    const dept = departments.find(
      (d) =>
        d.deptid === deptId || d.id === deptId || d.department_id === deptId
    );
    return dept?.name || "N/A";
  };

  const getLocationName = (locId) => {
    if (!locId) return "N/A";
    const loc = locations.find(
      (l) => l.id === locId || l.location_id === locId
    );
    return loc?.name || "N/A";
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Team Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-muted-foreground mb-2">Team Members</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{teamMembers?.length || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <UsersRound className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm font-medium text-muted-foreground mb-2">Departments</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {
                    new Set(
                      (teamMembers || [])
                        .map((m) => m.department_id)
                        .filter(Boolean)
                    ).size
                  }
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm font-medium text-muted-foreground mb-2">Locations</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {
                    new Set(
                      (teamMembers || [])
                        .map((m) => m.location_id || m.location)
                        .filter(Boolean)
                    ).size
                  }
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      {filteredMembers.length > 0 ? (
        <EmployeesTable data={filteredMembers} />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <UsersRound className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>
            {searchQuery
              ? "No team members found matching your search."
              : "No team members found."}
          </p>
        </div>
      )}
    </div>
  );
}
