import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { query } from "@/lib/db";

function toLocalDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "month"; // day | week | month | custom
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const now = new Date();
    let from: Date;
    let to = new Date(now);

    if (range === "day") {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === "week") {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      from = new Date(now);
      from.setDate(now.getDate() - diff);
      from.setHours(0, 0, 0, 0);
    } else if (range === "custom" && fromParam && toParam) {
      from = new Date(fromParam);
      to = new Date(toParam);
      to.setHours(23, 59, 59, 999);
    } else {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const fromStr = toLocalDateString(from);
    const toStr = toLocalDateString(to);

    const earningsRows = await query<{ total: number }[]>(
      `SELECT COALESCE(SUM(s.amount_paid), 0) AS total
       FROM sessions s
       JOIN procedures pr ON pr.id = s.procedure_id
       JOIN patients pt ON pt.id = pr.patient_id
       WHERE pt.dentist_id = :dentistId
         AND s.session_date BETWEEN :fromStr AND :toStr`,
      { dentistId: session.id, fromStr, toStr }
    );

    const earned = Number(earningsRows[0]?.total || 0);
    const clinicPct = Number(session.clinic_percentage || 0);
    const clinicShare = (earned * clinicPct) / 100;
    const dentistShare = earned - clinicShare;

    const patientsRows = await query<{ count: number }[]>(
      `SELECT COUNT(*) AS count FROM patients
       WHERE dentist_id = :dentistId
         AND DATE(created_at) BETWEEN :fromStr AND :toStr`,
      { dentistId: session.id, fromStr, toStr }
    );

    const activeProcedures = await query<{ count: number }[]>(
      `SELECT COUNT(*) AS count
       FROM procedures pr
       JOIN patients pt ON pt.id = pr.patient_id
       WHERE pt.dentist_id = :dentistId AND pr.status = 'active'`,
      { dentistId: session.id }
    );

    const finishedProcedures = await query<{ count: number }[]>(
      `SELECT COUNT(*) AS count
       FROM procedures pr
       JOIN patients pt ON pt.id = pr.patient_id
       WHERE pt.dentist_id = :dentistId AND pr.status = 'finished'
         AND DATE(pr.finished_at) BETWEEN :fromStr AND :toStr`,
      { dentistId: session.id, fromStr, toStr }
    );

    const sessionsCount = await query<{ count: number }[]>(
      `SELECT COUNT(*) AS count
       FROM sessions s
       JOIN procedures pr ON pr.id = s.procedure_id
       JOIN patients pt ON pt.id = pr.patient_id
       WHERE pt.dentist_id = :dentistId
         AND s.session_date BETWEEN :fromStr AND :toStr`,
      { dentistId: session.id, fromStr, toStr }
    );

    const totalPatients = await query<{ count: number }[]>(
      "SELECT COUNT(*) AS count FROM patients WHERE dentist_id = :dentistId",
      { dentistId: session.id }
    );

    const daily = await query<{ day: string; total: number }[]>(
      `SELECT DATE(s.session_date) AS day, COALESCE(SUM(s.amount_paid), 0) AS total
       FROM sessions s
       JOIN procedures pr ON pr.id = s.procedure_id
       JOIN patients pt ON pt.id = pr.patient_id
       WHERE pt.dentist_id = :dentistId
         AND s.session_date BETWEEN :fromStr AND :toStr
       GROUP BY DATE(s.session_date)
       ORDER BY day ASC`,
      { dentistId: session.id, fromStr, toStr }
    );

    const topProcedures = await query<
      { name: string; total: number; sessions: number }[]
    >(
      `SELECT pr.name,
              COALESCE(SUM(s.amount_paid), 0) AS total,
              COUNT(s.id) AS sessions
       FROM sessions s
       JOIN procedures pr ON pr.id = s.procedure_id
       JOIN patients pt ON pt.id = pr.patient_id
       WHERE pt.dentist_id = :dentistId
         AND s.session_date BETWEEN :fromStr AND :toStr
       GROUP BY pr.id, pr.name
       ORDER BY total DESC
       LIMIT 5`,
      { dentistId: session.id, fromStr, toStr }
    );

    // Quick comparison periods
    const todayStr = toLocalDateString(now);
    const weekStart = new Date(now);
    const d = now.getDay();
    weekStart.setDate(now.getDate() - (d === 0 ? 6 : d - 1));
    const weekStr = toLocalDateString(weekStart);
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const periodSum = async (fromDate: string) => {
      const rows = await query<{ total: number }[]>(
        `SELECT COALESCE(SUM(s.amount_paid), 0) AS total
         FROM sessions s
         JOIN procedures pr ON pr.id = s.procedure_id
         JOIN patients pt ON pt.id = pr.patient_id
         WHERE pt.dentist_id = :dentistId AND s.session_date >= :fromDate`,
        { dentistId: session.id, fromDate }
      );
      return Number(rows[0]?.total || 0);
    };

    return NextResponse.json({
      range,
      from: fromStr,
      to: toStr,
      clinic_percentage: clinicPct,
      stats: {
        earned,
        clinic_share: clinicShare,
        dentist_share: dentistShare,
        new_patients: Number(patientsRows[0]?.count || 0),
        total_patients: Number(totalPatients[0]?.count || 0),
        active_procedures: Number(activeProcedures[0]?.count || 0),
        finished_procedures: Number(finishedProcedures[0]?.count || 0),
        sessions: Number(sessionsCount[0]?.count || 0),
        today: await periodSum(todayStr),
        week: await periodSum(weekStr),
        month: await periodSum(monthStr),
      },
      charts: {
        daily: daily.map((r) => ({
          day: typeof r.day === "string" ? r.day : String(r.day).slice(0, 10),
          total: Number(r.total),
        })),
        topProcedures: topProcedures.map((r) => ({
          name: r.name,
          total: Number(r.total),
          sessions: Number(r.sessions),
        })),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
}
