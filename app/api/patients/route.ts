import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { requireSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { normalizeSyrianPhone } from "@/lib/format";
import type { Patient } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    let sql =
      "SELECT * FROM patients WHERE dentist_id = :dentistId ORDER BY created_at DESC";
    const params: Record<string, unknown> = { dentistId: session.id };

    if (q) {
      sql =
        "SELECT * FROM patients WHERE dentist_id = :dentistId AND (name LIKE :q OR phone LIKE :q) ORDER BY created_at DESC";
      params.q = `%${q}%`;
    }

    const patients = await query<Patient[]>(sql, params);
    return NextResponse.json({ patients });
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const name = String(body.name || "").trim();
    const phoneRaw = String(body.phone || "").trim();

    if (!name || !phoneRaw) {
      return NextResponse.json(
        { error: "الاسم ورقم الهاتف مطلوبان" },
        { status: 400 }
      );
    }

    const phone = normalizeSyrianPhone(phoneRaw);

    const result = await query<ResultSetHeader>(
      "INSERT INTO patients (dentist_id, name, phone) VALUES (:dentistId, :name, :phone)",
      { dentistId: session.id, name, phone }
    );

    return NextResponse.json({
      ok: true,
      patient: {
        id: result.insertId,
        dentist_id: session.id,
        name,
        phone,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "فشل إضافة المريض" }, { status: 500 });
  }
}
