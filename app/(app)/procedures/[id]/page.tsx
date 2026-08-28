"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import { AnimatedPage } from "@/components/animated-page";
import { ProcedureSkeleton } from "@/components/page-skeletons";
import { ToothChart } from "@/components/tooth-chart";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import type { SessionRecord } from "@/lib/types";

type ProcedureDetail = {
  id: number;
  patient_id: number;
  patient_name: string;
  name: string;
  total_price: number;
  status: "active" | "finished";
  paid_total: number;
  remaining: number;
};

export default function ProcedurePage() {
  const params = useParams<{ id: string }>();
  const [procedure, setProcedure] = useState<ProcedureDetail | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [teeth, setTeeth] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const previousTeeth = useMemo(
    () => Array.from(new Set(sessions.flatMap((s) => s.teeth || []))),
    [sessions]
  );

  async function load() {
    const res = await fetch(`/api/procedures/${params.id}`);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "تعذر التحميل");
      setInitialLoading(false);
      return;
    }
    setProcedure(data.procedure);
    setSessions(data.sessions);
    setInitialLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function addSession(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/procedures/${params.id}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          amount_paid: Number(amountPaid || 0),
          teeth,
          session_date: sessionDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "فشل إضافة الجلسة");
        return;
      }
      toast.success("تمت إضافة الجلسة");
      setOpen(false);
      setNotes("");
      setAmountPaid("");
      setTeeth([]);
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function finishProcedure() {
    const res = await fetch(`/api/procedures/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "finish" }),
    });
    if (!res.ok) {
      toast.error("تعذر إنهاء الإجراء");
      return;
    }
    toast.success("تم إنهاء الإجراء بنجاح");
    await load();
  }

  if (initialLoading) {
    return <ProcedureSkeleton />;
  }

  if (!procedure) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        الإجراء غير موجود
      </div>
    );
  }

  return (
    <AnimatedPage>
      <div className="anim-block">
        <Link
          href={`/patients/${procedure.patient_id}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mb-3 gap-1 px-0"
          )}
        >
          <ArrowRight className="size-4" />
          العودة لملف {procedure.patient_name}
        </Link>

        <div className="rounded-3xl border bg-card/80 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-extrabold">{procedure.name}</h1>
                <Badge
                  variant={procedure.status === "finished" ? "secondary" : "default"}
                >
                  {procedure.status === "finished" ? "مكتمل" : "نشط"}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground">
                المريض: {procedure.patient_name}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {procedure.status === "active" && (
                <>
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger
                      className={cn(buttonVariants({ className: "gap-2" }))}
                    >
                      <Plus className="size-4" />
                      جلسة جديدة
                    </DialogTrigger>
                    <DialogContent
                      dir="rtl"
                      className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
                    >
                      <DialogHeader>
                        <DialogTitle>إضافة جلسة علاجية</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={addSession} className="space-y-4">
                        <div className="space-y-2">
                          <Label>تاريخ الجلسة</Label>
                          <Input
                            type="date"
                            dir="ltr"
                            value={sessionDate}
                            onChange={(e) => setSessionDate(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>المبلغ المدفوع في هذه الجلسة</Label>
                          <Input
                            type="number"
                            min="0"
                            dir="ltr"
                            className="text-left"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            المتبقي حالياً: {formatCurrency(procedure.remaining)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>ملاحظات الجلسة</Label>
                          <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="ملاحظات الطبيب عن الجلسة..."
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>اختيار الأسنان المعالجة</Label>
                          <ToothChart
                            selected={teeth}
                            onChange={setTeeth}
                            previouslyWorked={previousTeeth}
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          حفظ الجلسة
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={finishProcedure}
                  >
                    <CheckCircle2 className="size-4" />
                    إنهاء الإجراء
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-secondary/60 p-4">
              <p className="text-xs text-muted-foreground">السعر الإجمالي</p>
              <p className="mt-1 text-xl font-bold">
                {formatCurrency(procedure.total_price)}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs text-muted-foreground">المدفوع</p>
              <p className="mt-1 text-xl font-bold text-emerald-700">
                {formatCurrency(procedure.paid_total)}
              </p>
            </div>
            <div className="rounded-2xl bg-accent/20 p-4">
              <p className="text-xs text-muted-foreground">المتبقي</p>
              <p className="mt-1 text-xl font-bold">
                {formatCurrency(procedure.remaining)}
              </p>
            </div>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-to-l from-primary to-emerald-400 transition-all"
              style={{
                width: `${Math.min(
                  100,
                  (procedure.paid_total / Math.max(1, procedure.total_price)) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="anim-block space-y-3">
        <h2 className="text-xl font-bold">سجل الجلسات</h2>
        {sessions.map((session) => (
          <div
            key={session.id}
            className="rounded-2xl border bg-card/80 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold" dir="ltr">
                  {String(session.session_date).slice(0, 10)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {session.notes || "بدون ملاحظات"}
                </p>
                {!!session.teeth?.length && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {session.teeth.map((t) => (
                      <Badge key={t} variant="outline">
                        سن {t}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-lg font-extrabold text-primary">
                {formatCurrency(Number(session.amount_paid))}
              </p>
            </div>
          </div>
        ))}
        {!sessions.length && (
          <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
            لم تُسجَّل أي جلسات بعد
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
