import { NextResponse } from "next/server";
import { getSession, refreshSessionFromDb, requireSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  return NextResponse.json({ dentist: session });
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const clinicPercentage = Number(body.clinic_percentage);

    if (
      Number.isNaN(clinicPercentage) ||
      clinicPercentage < 0 ||
      clinicPercentage > 100
    ) {
      return NextResponse.json(
        { error: "نسبة العيادة يجب أن تكون بين 0 و 100" },
        { status: 400 }
      );
    }

    await query(
      "UPDATE dentists SET clinic_percentage = :pct WHERE id = :id",
      { pct: clinicPercentage, id: session.id }
    );

    const updated = await refreshSessionFromDb(session.id);
    return NextResponse.json({ ok: true, dentist: updated });
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
}
