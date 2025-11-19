"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  UsersRound,
  Mail,
  Phone,
  Building,
  MapPin,
  Search,
  UserCircle,
} from "lucide-react";
import { externalApiClient } from "@/app/services/externalApiClient";
import { toast } from "sonner";

export default function TeamDirectory({ teamMembers }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMembers, setFilteredMembers] = useState(teamMembers || []);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);

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
        externalApiClient.get("/departments").catch(() => ({ data: { departments: [] } })),
        externalApiClient.get("/locations").catch(() => ({ data: { locations: [] } })),
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
    const filtered = (teamMembers || []).filter((member) => {
      const name = (member.employee_name || member.name || "").toLowerCase();
      const email = (member.email || member.employee_email || "").toLowerCase();
      const code = (member.employee_code || "").toLowerCase();
      const dept = getDepartmentName(member.department_id || member.department)
        .toLowerCase();

      return (
        name.includes(query) ||
        email.includes(query) ||
        code.includes(query) ||
        dept.includes(query)
      );
    });

    setFilteredMembers(filtered);
  };

  const getDepartmentName = (deptId) => {
    if (!deptId) return "N/A";
    const dept = departments.find(
      (d) => d.id === deptId || d.department_id === deptId
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
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Team Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email, employee code, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team Members</CardTitle>
            <Badge variant="secondary">
              {filteredMembers.length} member(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMembers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Employee Code</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member, index) => {
                    const name = member.employee_name || member.name || "Unknown";
                    const email = member.email || member.employee_email || "-";
                    const phone = member.phone || member.phone_number || "-";
                    const code = member.employee_code || "-";

                    return (
                      <TableRow key={member.employee_id || member.id || index}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {getInitials(name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{name}</p>
                              {member.designation && (
                                <p className="text-sm text-muted-foreground">
                                  {member.designation}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{code}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {phone !== "-" ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{phone}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {getDepartmentName(
                                member.department_id || member.department
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {getLocationName(member.location_id || member.location)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
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
        </CardContent>
      </Card>

      {/* Team Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">{teamMembers?.length || 0}</p>
              <div className="p-3 rounded-full bg-blue-100">
                <UsersRound className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">
                {new Set(
                  (teamMembers || [])
                    .map((m) => m.department_id || m.department)
                    .filter(Boolean)
                ).size}
              </p>
              <div className="p-3 rounded-full bg-purple-100">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">
                {new Set(
                  (teamMembers || [])
                    .map((m) => m.location_id || m.location)
                    .filter(Boolean)
                ).size}
              </p>
              <div className="p-3 rounded-full bg-green-100">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

