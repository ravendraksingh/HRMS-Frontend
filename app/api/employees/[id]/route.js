import { authorizeRequest } from "@/lib/authorizeRequest";
import { fetchBackend } from "@/lib/fetchBackend";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const result = await authorizeRequest(req, {
    requiredRole: ["admin", "hr_manager"],
  });

  if (!result.authorized) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const res = await fetchBackend(`/employees/${id}`, {}, req);
    if (res.status >= 200 && res.status < 300) {
      return NextResponse.json(res.data, { status: res.status });
    } else {
      // New format: { "error": "...", "status": 404, "path": "...", "method": "..." }
      const errorMessage = res.data?.error || res.data?.message || "Non-ok response";
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: res.status }
      );
    }
  } catch (error) {
    console.error("Error fetching employee:", error);
    const status = error.response?.status || 500;
    // New format: { "error": "...", "status": 404, "path": "...", "method": "..." }
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status });
  }
}

export async function PATCH(req, { params }) {
  const result = await authorizeRequest(req, {
    requiredRole: ["admin", "hr_manager"],
  });

  if (!result.authorized) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const res = await fetchBackend(`/employees/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, req);
    if (res.status >= 200 && res.status < 300) {
      return NextResponse.json(res.data, { status: res.status });
    } else {
      let errorMessage = "Non-ok response received";
      if (res.data) {
        const errorData = typeof res.data === "string" ? { error: res.data } : res.data;
        // New format: { "error": "...", "status": 404, "path": "...", "method": "..." }
        errorMessage = errorData.error || errorData.message || errorMessage;
      }
      return NextResponse.json({ success: false, message: errorMessage }, { status: res.status });
    }
  } catch (error) {
    console.error("Error updating employee:", error);
    const status = error.response?.status || 500;
    // New format: { "error": "...", "status": 404, "path": "...", "method": "..." }
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status });
  }
}

// Keep PUT for backward compatibility, but it will use PATCH internally
export async function PUT(req, { params }) {
  return PATCH(req, { params });
}

export async function DELETE(req, { params }) {
  const result = await authorizeRequest(req, {
    requiredRole: ["admin", "hr_manager"],
  });

  if (!result.authorized) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const res = await fetchBackend(`/employees/${id}`, {
      method: "DELETE",
    }, req);

    // Handle 204 No Content - cannot have a body
    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    // For other status codes, try to get the response body
    if (res.status >= 200 && res.status < 300) {
      return NextResponse.json(res.data || { success: true }, { status: res.status });
    } else {
      // Handle error responses
      let errorMessage = "Failed to delete employee";
      if (res.data) {
        const errorData = typeof res.data === "string" ? { error: res.data } : res.data;
        // New format: { "error": "...", "status": 404, "path": "...", "method": "..." }
        errorMessage = errorData.error || errorData.message || errorMessage;
      }
      return NextResponse.json({ error: errorMessage }, { status: res.status });
    }
  } catch (error) {
    console.error("Error deleting employee:", error);
    const status = error.response?.status || 500;
    // New format: { "error": "...", "status": 404, "path": "...", "method": "..." }
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status });
  }
}
