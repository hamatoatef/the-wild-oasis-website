import { getGuest } from "@/app/_lib/data-service";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { email } = params;

  try {
    const guests = await getGuest(email);
    return NextResponse.json({ message: "Guest created successfully" });
  } catch {
    return Response.json({ message: "guest not fount" });
  }
}
