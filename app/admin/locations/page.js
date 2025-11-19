"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { externalApiClient } from "@/app/services/externalApiClient";
import { useAuth } from "@/components/auth/AuthContext";
import OrganizationInfoCard from "@/components/common/OrganizationInfoCard";

const LocationsPage = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newLocation, setNewLocation] = useState({
    name: "",
    address_line1: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    phone: "",
  });
  const [draftLocation, setDraftLocation] = useState({});

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await externalApiClient.get("/locations");
      setLocations(res.data.locations);
    } catch (e) {
      console.error("Error fetching locations:", e);
      setError("Error fetching locations");
      toast.error("Failed to load locations");
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setAdding(true);
    setNewLocation({
      name: "",
      address_line1: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
      phone: "",
    });
    setError("");
  };

  const handleCancelNew = () => {
    setAdding(false);
    setNewLocation({
      name: "",
      address_line1: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
      phone: "",
    });
    setError("");
  };

  const handleNewLocationChange = (e) => {
    const { name, value } = e.target;
    setNewLocation((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveNew = async () => {
    if (!newLocation.name || !newLocation.name.trim()) {
      setError("Name is required");
      toast.error("Name is required");
      return;
    }
    if (!user?.org_id && !user?.organization_id) {
      setError("Organization ID not found");
      toast.error("Organization ID not found");
      return;
    }
    try {
      const res = await externalApiClient.post("/locations", {
        ...newLocation,
        organization_id: user?.org_id || user?.organization_id,
      });
      console.log("Add location response:", res.data);
      toast.success("Location added successfully!");
      handleCancelNew();
      setError("");
      await fetchLocations();
    } catch (error) {
      console.error("Error adding location:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to add location";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleEdit = (location) => {
    setEditingId(location.id);
    setDraftLocation({ ...location });
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraftLocation({});
    setError("");
  };

  const handleSaveEdit = async (location) => {
    try {
      const res = await externalApiClient.patch(
        `/locations/${location.id}`,
        draftLocation
      );
      toast.success("Location updated successfully!");
      handleCancelEdit();
      setError("");
      await fetchLocations();
    } catch (error) {
      console.error("Error updating location:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to update location";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (location) => {
    if (!confirm(`Are you sure you want to delete ${location.name}?`)) return;
    try {
      await externalApiClient.delete(`/locations/${location.id}`);
      toast.success("Location deleted successfully!");
      await fetchLocations();
    } catch (error) {
      console.error("Error deleting location:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to delete location";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="px-5">
      <h1 className="text-3xl text-center font-bold mb-3">Locations</h1>

      {/* Organization Info Card */}
      <OrganizationInfoCard />

      {error && (
        <div className="max-w-[1000px] mx-auto mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      <div className="max-w-[1000px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Location List</h2>
          {!adding && (
            <Button onClick={handleAddNew} disabled={editingId !== null}>
              Add New Location
            </Button>
          )}
        </div>

        {adding && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Add New Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="mb-1">
                    Name *
                  </Label>
                  <Input
                    type="text"
                    name="name"
                    id="name"
                    value={newLocation.name}
                    onChange={handleNewLocationChange}
                    placeholder="Enter location name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="mb-1">
                    Phone
                  </Label>
                  <Input
                    type="text"
                    name="phone"
                    id="phone"
                    value={newLocation.phone}
                    onChange={handleNewLocationChange}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="address_line1" className="mb-1">
                    Address Line 1
                  </Label>
                  <Input
                    type="text"
                    name="address_line1"
                    id="address_line1"
                    value={newLocation.address_line1}
                    onChange={handleNewLocationChange}
                    placeholder="Enter address"
                  />
                </div>
                <div>
                  <Label htmlFor="city" className="mb-1">
                    City
                  </Label>
                  <Input
                    type="text"
                    name="city"
                    id="city"
                    value={newLocation.city}
                    onChange={handleNewLocationChange}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="mb-1">
                    State
                  </Label>
                  <Input
                    type="text"
                    name="state"
                    id="state"
                    value={newLocation.state}
                    onChange={handleNewLocationChange}
                    placeholder="Enter state"
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code" className="mb-1">
                    Postal Code
                  </Label>
                  <Input
                    type="text"
                    name="postal_code"
                    id="postal_code"
                    value={newLocation.postal_code}
                    onChange={handleNewLocationChange}
                    placeholder="Enter postal code"
                  />
                </div>
                <div>
                  <Label htmlFor="country" className="mb-1">
                    Country
                  </Label>
                  <Input
                    type="text"
                    name="country"
                    id="country"
                    value={newLocation.country}
                    onChange={handleNewLocationChange}
                    placeholder="Enter country"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSaveNew}>Save</Button>
                <Button onClick={handleCancelNew} variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="py-8 text-center">
              Loading locations...
            </CardContent>
          </Card>
        ) : locations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No locations found. Click "Add New Location" to create one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {locations.map((location) => (
              <Card key={location.id}>
                <CardContent className="p-6">
                  {editingId === location.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-1">Name *</Label>
                        <Input
                          value={draftLocation.name || ""}
                          onChange={(e) =>
                            setDraftLocation({
                              ...draftLocation,
                              name: e.target.value,
                            })
                          }
                          placeholder="Enter location name"
                          required
                        />
                      </div>
                      <div>
                        <Label className="mb-1">Phone</Label>
                        <Input
                          value={draftLocation.phone || ""}
                          onChange={(e) =>
                            setDraftLocation({
                              ...draftLocation,
                              phone: e.target.value,
                            })
                          }
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div>
                        <Label className="mb-1">Address Line 1</Label>
                        <Input
                          value={draftLocation.address_line1 || ""}
                          onChange={(e) =>
                            setDraftLocation({
                              ...draftLocation,
                              address_line1: e.target.value,
                            })
                          }
                          placeholder="Enter address"
                        />
                      </div>
                      <div>
                        <Label className="mb-1">City</Label>
                        <Input
                          value={draftLocation.city || ""}
                          onChange={(e) =>
                            setDraftLocation({
                              ...draftLocation,
                              city: e.target.value,
                            })
                          }
                          placeholder="Enter city"
                        />
                      </div>
                      <div>
                        <Label className="mb-1">State</Label>
                        <Input
                          value={draftLocation.state || ""}
                          onChange={(e) =>
                            setDraftLocation({
                              ...draftLocation,
                              state: e.target.value,
                            })
                          }
                          placeholder="Enter state"
                        />
                      </div>
                      <div>
                        <Label className="mb-1">Postal Code</Label>
                        <Input
                          value={draftLocation.postal_code || ""}
                          onChange={(e) =>
                            setDraftLocation({
                              ...draftLocation,
                              postal_code: e.target.value,
                            })
                          }
                          placeholder="Enter postal code"
                        />
                      </div>
                      <div>
                        <Label className="mb-1">Country</Label>
                        <Input
                          value={draftLocation.country || ""}
                          onChange={(e) =>
                            setDraftLocation({
                              ...draftLocation,
                              country: e.target.value,
                            })
                          }
                          placeholder="Enter country"
                        />
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(location)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {location.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {location.address_line1 &&
                              `${location.address_line1}, `}
                            {location.city && `${location.city}, `}
                            {location.state && `${location.state} `}
                            {location.postal_code}
                          </p>
                          {location.country && (
                            <p className="text-sm text-gray-600">
                              {location.country}
                            </p>
                          )}
                          {location.phone && (
                            <p className="text-sm text-gray-600 mt-1">
                              Phone: {location.phone}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEdit(location)}
                            disabled={adding}
                            variant="outline"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(location)}
                            disabled={adding}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationsPage;
