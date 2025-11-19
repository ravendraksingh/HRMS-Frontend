import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/getBackendUrl";

export async function GET(req) {
  // Extract query parameters
  const params = req.nextUrl.searchParams;
  const username = params.get("username");
  const department = params.get("department");
  const manager_id = params.get("manager_id");
  const name = params.get("name");
  const page = params.get("page");
  const limit = params.get("limit");

  // Build backend API query string
  // Only include filters if provided
  const backendParams = new URLSearchParams();
  if (username) backendParams.append("username", username);
  if (department) backendParams.append("department", department);
  if (manager_id) backendParams.append("manager_id", manager_id);
  if (name) backendParams.append("name", name);
  if (page) backendParams.append("page", page);
  if (limit) backendParams.append("limit", limit);

  const backendBaseUrl = getBackendUrl();
  const backendUrl = `${backendBaseUrl}/paginated/employees?${backendParams.toString()}`;
  console.log(backendUrl);

  try {
    const res = await fetch(backendUrl);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: "Non-OK response from backend" },
        { status: res.status }
      );
    }
  } catch (error) {
    console.log("Error occurred in fetching employees data:", error);
    return NextResponse.json({ error: error.message }, { status: 501 });
  }
}
