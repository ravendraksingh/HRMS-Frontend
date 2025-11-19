import { authorizeRequest } from "@/lib/authorizeRequest";
import { fetchBackend } from "@/lib/fetchBackend";
import { NextResponse } from "next/server";

export async function GET(req) {
  const result = await authorizeRequest(req);

  if (!result.authorized) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const employeeId = searchParams.get("employeeId");

    let url = "/reports/attendance/monthly?";
    if (month) url += `month=${month}&`;
    if (employeeId) url += `employee_id=${employeeId}&`;
    url = url.replace(/&$/, "");

    const res = await fetchBackend(url, {}, req);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
