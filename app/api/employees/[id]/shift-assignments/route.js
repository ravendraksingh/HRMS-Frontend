import { authorizeRequest } from "@/lib/authorizeRequest";
import { fetchBackend } from "@/lib/fetchBackend";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const result = await authorizeRequest(req);

  if (!result.authorized) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const res = await fetchBackend(`/employees/${id}/shift-assignments`, {}, req);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const result = await authorizeRequest(req, {
    requiredRole: "admin",
  });

  if (!result.authorized) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const res = await fetchBackend(`/employees/${id}/shift-assignments`, {
      method: "POST",
      body: JSON.stringify(body),
    }, req);

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

