import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { query } from "@/lib/db";
import type { SessionRecord } from "@/lib/types";

function parseTeeth(raw: unknown): number[] {
  if (Array.isArray(raw)) return raw.map(Number);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function getOwnedSession(sessionId: number, dentistId: number) {
  const rows = await query<
    (SessionRecord & { procedure_status: string })[]
  >(
    `SELECT s.*, pr.status AS procedure_status
     FROM sessions s
     JOIN procedures pr ON pr.id = s.procedure_id
     JOIN patients pt ON pt.id = pr.patient_id
     WHERE s.id = :id AND pt.dentist_id = :dentistId
     LIMIT 1`,
    { id: sessionId, dentistId }
  );
  const session = rows[0];
  if (!session) return null;
  return {
    ...session,
    amount_paid: Number(session.amount_paid),
    teeth: parseTeeth(session.teeth),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession();
    const { id } = await params;
    const session = await getOwnedSession(Number(id), auth.id);
    if (!session) {
      return NextResponse.json({ error: "الجلسة غير موجودة" }, { status: 404 });
    }
    return NextResponse.json({ session });
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession();
    const { id } = await params;
    const sessionId = Number(id);
    const existing = await getOwnedSession(sessionId, auth.id);
    if (!existing) {
      return NextResponse.json({ error: "الجلسة غير موجودة" }, { status: 404 });
    }
    if (existing.procedure_status === "finished") {
      return NextResponse.json(
        { error: "لا يمكن تعديل جلسة لإجراء مكتمل" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const notes = String(body.notes ?? existing.notes ?? "").trim();
    const amountPaid = Number(body.amount_paid ?? existing.amount_paid);
    const teeth = Array.isArray(body.teeth)
      ? body.teeth.map(Number).filter((n: number) => !Number.isNaN(n))
      : existing.teeth;
    const sessionDate =
      String(body.session_date || existing.session_date).slice(0, 10) ||
      new Date().toISOString().slice(0, 10);

    if (Number.isNaN(amountPaid) || amountPaid < 0) {
      return NextResponse.json({ error: "المبلغ المدفوع غير صالح" }, { status: 400 });
    }

    await query(
      `UPDATE sessions
       SET notes = :notes, amount_paid = :amountPaid, teeth = CAST(:teeth AS JSON), session_date = :sessionDate
       WHERE id = :id`,
      {
        notes,
        amountPaid,
        teeth: JSON.stringify(teeth),
        sessionDate,
        id: sessionId,
      }
    );

    return NextResponse.json({
      ok: true,
      session: {
        ...existing,
        notes,
        amount_paid: amountPaid,
        teeth,
        session_date: sessionDate,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "فشل تحديث الجلسة" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession();
    const { id } = await params;
    const sessionId = Number(id);
    const existing = await getOwnedSession(sessionId, auth.id);
    if (!existing) {
      return NextResponse.json({ error: "الجلسة غير موجودة" }, { status: 404 });
    }
    if (existing.procedure_status === "finished") {
      return NextResponse.json(
        { error: "لا يمكن حذف جلسة لإجراء مكتمل" },
        { status: 400 }
      );
    }

    await query("DELETE FROM sessions WHERE id = :id", { id: sessionId });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
}
