import { NextResponse } from "next/server";
import {
  getSession,
  hashPassword,
  refreshSessionFromDb,
  requireSession,
  verifyPassword,
} from "@/lib/auth";
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

    if (body.clinic_percentage !== undefined) {
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
    }

    const name =
      body.name !== undefined ? String(body.name).trim() : undefined;
    const username =
      body.username !== undefined
        ? String(body.username).trim().toLowerCase()
        : undefined;
    const newPassword =
      body.new_password !== undefined
        ? String(body.new_password)
        : undefined;

    if (name !== undefined && !name) {
      return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
    }

    if (username !== undefined && !username) {
      return NextResponse.json({ error: "اسم المستخدم مطلوب" }, { status: 400 });
    }

    if (username !== undefined && username !== session.username) {
      const taken = await query<{ id: number }[]>(
        "SELECT id FROM dentists WHERE username = :username AND id != :id LIMIT 1",
        { username, id: session.id }
      );
      if (taken.length) {
        return NextResponse.json(
          { error: "اسم المستخدم مستخدم بالفعل" },
          { status: 400 }
        );
      }
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
          { status: 400 }
        );
      }
      const rows = await query<{ password_hash: string }[]>(
        "SELECT password_hash FROM dentists WHERE id = :id LIMIT 1",
        { id: session.id }
      );
      const currentPassword = String(body.current_password || "");
      const ok = await verifyPassword(currentPassword, rows[0]?.password_hash || "");
      if (!ok) {
        return NextResponse.json(
          { error: "كلمة المرور الحالية غير صحيحة" },
          { status: 400 }
        );
      }
      const passwordHash = await hashPassword(newPassword);
      await query("UPDATE dentists SET password_hash = :hash WHERE id = :id", {
        hash: passwordHash,
        id: session.id,
      });
    }

    if (name !== undefined) {
      await query("UPDATE dentists SET name = :name WHERE id = :id", {
        name,
        id: session.id,
      });
    }

    if (username !== undefined) {
      await query("UPDATE dentists SET username = :username WHERE id = :id", {
        username,
        id: session.id,
      });
    }

    const updated = await refreshSessionFromDb(session.id);
    return NextResponse.json({ ok: true, dentist: updated });
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
}
