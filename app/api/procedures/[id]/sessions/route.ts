import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { query } from "@/lib/db";
import type { ResultSetHeader } from "mysql2";

async function assertProcedureOwned(procedureId: number, dentistId: number) {
  const rows = await query<{ id: number; status: string }[]>(
    `SELECT pr.id, pr.status
     FROM procedures pr
     JOIN patients pt ON pt.id = pr.patient_id
     WHERE pr.id = :id AND pt.dentist_id = :dentistId
     LIMIT 1`,
    { id: procedureId, dentistId }
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
    const procedureId = Number(id);
    const procedure = await assertProcedureOwned(procedureId, session.id);
    if (!procedure) {
      return NextResponse.json({ error: "الإجراء غير موجود" }, { status: 404 });
    }
    if (procedure.status === "finished") {
      return NextResponse.json(
        { error: "لا يمكن إضافة جلسة لإجراء مكتمل" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const notes = String(body.notes || "").trim();
    const amountPaid = Number(body.amount_paid || 0);
    const teeth = Array.isArray(body.teeth)
      ? body.teeth.map(Number).filter((n: number) => !Number.isNaN(n))
      : [];
    const sessionDate =
      String(body.session_date || "").slice(0, 10) ||
      new Date().toISOString().slice(0, 10);

    if (Number.isNaN(amountPaid) || amountPaid < 0) {
      return NextResponse.json({ error: "المبلغ المدفوع غير صالح" }, { status: 400 });
    }

    const result = await query<ResultSetHeader>(
      `INSERT INTO sessions (procedure_id, notes, amount_paid, teeth, session_date)
       VALUES (:procedureId, :notes, :amountPaid, CAST(:teeth AS JSON), :sessionDate)`,
      {
        procedureId,
        notes,
        amountPaid,
        teeth: JSON.stringify(teeth),
        sessionDate,
      }
    );

    return NextResponse.json({
      ok: true,
      session: {
        id: result.insertId,
        procedure_id: procedureId,
        notes,
        amount_paid: amountPaid,
        teeth,
        session_date: sessionDate,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "فشل إضافة الجلسة" }, { status: 500 });
  }
}
