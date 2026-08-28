"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AnimatedPage } from "@/components/animated-page";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SessionDialogForm } from "@/components/session-dialog-form";
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
  const router = useRouter();
  const [procedure, setProcedure] = useState<ProcedureDetail | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editSession, setEditSession] = useState<SessionRecord | null>(null);
  const [deleteSession, setDeleteSession] = useState<SessionRecord | null>(null);
  const [notes, setNotes] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [teeth, setTeeth] = useState<number[]>([]);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const previousTeeth = useMemo(
    () =>
      Array.from(
        new Set(
          sessions
            .filter((s) => s.id !== editSession?.id)
            .flatMap((s) => s.teeth || [])
        )
      ),
    [sessions, editSession]
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
    setEditName(data.procedure.name);
    setEditPrice(String(data.procedure.total_price));
    setInitialLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  function resetSessionForm() {
    setNotes("");
    setAmountPaid("");
    setSessionDate(new Date().toISOString().slice(0, 10));
    setTeeth([]);
  }

  function openSessionEditor(session: SessionRecord) {
    setEditSession(session);
    setNotes(session.notes || "");
    setAmountPaid(String(session.amount_paid));
    setSessionDate(String(session.session_date).slice(0, 10));
    setTeeth(session.teeth || []);
  }

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
      resetSessionForm();
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function updateSession(e: React.FormEvent) {
    e.preventDefault();
    if (!editSession) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${editSession.id}`, {
        method: "PATCH",
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
        toast.error(data.error || "فشل تحديث الجلسة");
        return;
      }
      toast.success("تم تحديث الجلسة");
      setEditSession(null);
      resetSessionForm();
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function removeSession() {
    if (!deleteSession) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${deleteSession.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "فشل حذف الجلسة");
        return;
      }
      toast.success("تم حذف الجلسة");
      setDeleteSession(null);
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function updateProcedure(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/procedures/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          total_price: Number(editPrice),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "فشل التحديث");
        return;
      }
      toast.success("تم تحديث الإجراء");
      setEditOpen(false);
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function removeProcedure() {
    setLoading(true);
    try {
      const res = await fetch(`/api/procedures/${params.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "فشل الحذف");
        return;
      }
      toast.success("تم حذف الإجراء");
      router.push(`/patients/${data.patient_id || procedure?.patient_id}`);
      router.refresh();
    } finally {
      setLoading(false);
      setDeleteOpen(false);
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

  async function reopenProcedure() {
    const res = await fetch(`/api/procedures/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reopen" }),
    });
    if (!res.ok) {
      toast.error("تعذر إعادة فتح الإجراء");
      return;
    }
    toast.success("تم إعادة فتح الإجراء");
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

  const isActive = procedure.status === "active";

  const sessionFields = (
    <>
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
    </>
  );

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
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive ? "نشط" : "مكتمل"}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground">
                المريض: {procedure.patient_name}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger
                  className={cn(
                    buttonVariants({ variant: "outline", className: "gap-2" })
                  )}
                >
                  <Pencil className="size-4" />
                  تعديل
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader>
                    <DialogTitle>تعديل الإجراء</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={updateProcedure} className="space-y-4">
                    <div className="space-y-2">
                      <Label>اسم الإجراء</Label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>السعر الإجمالي</Label>
                      <Input
                        type="number"
                        min="0"
                        dir="ltr"
                        className="text-left"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      حفظ التعديلات
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
                حذف
              </Button>

              {isActive ? (
                <>
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger
                      className={cn(buttonVariants({ className: "gap-2" }))}
                    >
                      <Plus className="size-4" />
                      جلسة جديدة
                    </DialogTrigger>
                    <SessionDialogForm
                      title="إضافة جلسة علاجية"
                      submitLabel="حفظ الجلسة"
                      loading={loading}
                      onSubmit={addSession}
                    >
                      {sessionFields}
                    </SessionDialogForm>
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
              ) : (
                <Button variant="outline" className="gap-2" onClick={reopenProcedure}>
                  <RotateCcw className="size-4" />
                  إعادة فتح
                </Button>
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
          <div key={session.id} className="rounded-2xl border bg-card/80 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
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
              <div className="flex flex-col items-end gap-2">
                <p className="text-lg font-extrabold text-primary">
                  {formatCurrency(Number(session.amount_paid))}
                </p>
                {isActive && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => openSessionEditor(session)}
                    >
                      <Pencil className="size-3.5" />
                      تعديل
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1"
                      onClick={() => setDeleteSession(session)}
                    >
                      <Trash2 className="size-3.5" />
                      حذف
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {!sessions.length && (
          <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
            لم تُسجَّل أي جلسات بعد
          </div>
        )}
      </div>

      <Dialog
        open={!!editSession}
        onOpenChange={(next) => {
          if (!next) {
            setEditSession(null);
            resetSessionForm();
          }
        }}
      >
        <SessionDialogForm
          title="تعديل الجلسة"
          submitLabel="حفظ التعديلات"
          loading={loading}
          onSubmit={updateSession}
        >
          {sessionFields}
        </SessionDialogForm>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف الإجراء"
        description="سيتم حذف الإجراء وجميع جلساته نهائياً."
        confirmLabel="حذف الإجراء"
        loading={loading}
        destructive
        onConfirm={removeProcedure}
      />

      <ConfirmDialog
        open={!!deleteSession}
        onOpenChange={(next) => !next && setDeleteSession(null)}
        title="حذف الجلسة"
        description="سيتم حذف هذه الجلسة نهائياً وسيتغير المبلغ المدفوع والمتبقي."
        confirmLabel="حذف الجلسة"
        loading={loading}
        destructive
        onConfirm={removeSession}
      />
    </AnimatedPage>
  );
}
