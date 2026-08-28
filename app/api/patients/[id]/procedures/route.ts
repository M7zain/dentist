import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { query } from "@/lib/db";
import type { ResultSetHeader } from "mysql2";

async function assertPatientOwned(patientId: number, dentistId: number) {
  const rows = await query<{ id: number }[]>(
    "SELECT id FROM patients WHERE id = :id AND dentist_id = :dentistId LIMIT 1",
    { id: patientId, dentistId }
  );
  return rows[0] || null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const patientId = Number(id);
    const owned = await assertPatientOwned(patientId, session.id);
    if (!owned) {
      return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });
    }

    const body = await request.json();
    const name = String(body.name || "").trim();
    const totalPrice = Number(body.total_price);

    if (!name || Number.isNaN(totalPrice) || totalPrice < 0) {
      return NextResponse.json(
        { error: "اسم الإجراء والسعر الإجمالي مطلوبان" },
        { status: 400 }
      );
    }

    const result = await query<ResultSetHeader>(
      "INSERT INTO procedures (patient_id, name, total_price, status) VALUES (:patientId, :name, :totalPrice, 'active')",
      { patientId, name, totalPrice }
    );

    return NextResponse.json({
      ok: true,
      procedure: {
        id: result.insertId,
        patient_id: patientId,
        name,
        total_price: totalPrice,
        status: "active",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "فشل إنشاء الإجراء" }, { status: 500 });
  }
}
