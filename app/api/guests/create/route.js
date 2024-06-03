import { createGuest } from "@/app/_lib/data-service";

export async function POST(request) {
  try {
    const guests = await createGuest(request.body);
    return Response.json({ message: "Guest created successfully" });
  } catch {
    return Response.json({ error: "Failed to create guest" });
  }
}
