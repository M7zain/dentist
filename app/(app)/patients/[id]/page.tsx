"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, MessageCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AnimatedPage } from "@/components/animated-page";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PatientDetailSkeleton } from "@/components/page-skeletons";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency, toWhatsAppLink } from "@/lib/format";
import type { Patient, ProcedureWithTotals } from "@/lib/types";

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [procedures, setProcedures] = useState<ProcedureWithTotals[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  async function load() {
    const res = await fetch(`/api/patients/${params.id}`);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "تعذر التحميل");
      setInitialLoading(false);
      return;
    }
    setPatient(data.patient);
    setProcedures(data.procedures);
    setEditName(data.patient.name);
    setEditPhone(data.patient.phone.replace(/^\+963/, ""));
    setInitialLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function addProcedure(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${params.id}/procedures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          total_price: Number(totalPrice),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "فشل الإنشاء");
        return;
      }
      toast.success("تم إنشاء الإجراء");
      setOpen(false);
      setName("");
      setTotalPrice("");
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function updatePatient(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, phone: editPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "فشل التحديث");
        return;
      }
      toast.success("تم تحديث بيانات المريض");
      setEditOpen(false);
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function deletePatient() {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${params.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "فشل الحذف");
        return;
      }
      toast.success("تم حذف المريض");
      router.push("/patients");
      router.refresh();
    } finally {
      setLoading(false);
      setDeleteOpen(false);
    }
  }

  if (initialLoading) {
    return <PatientDetailSkeleton />;
  }

  if (!patient) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        المريض غير موجود
      </div>
    );
  }

  return (
    <AnimatedPage>
      <div className="anim-block">
        <Link
          href="/patients"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mb-3 gap-1 px-0"
          )}
        >
          <ArrowRight className="size-4" />
          العودة للمرضى
        </Link>
        <div className="flex flex-col gap-4 rounded-3xl border bg-card/80 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">{patient.name}</h1>
            <p className="mt-1 text-muted-foreground" dir="ltr">
              {patient.phone}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={toWhatsAppLink(patient.phone)}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants(),
                "gap-2 bg-[#25D366] hover:bg-[#1ebe57]"
              )}
            >
              <MessageCircle className="size-4" />
              واتساب مباشرة
            </a>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger
                className={cn(buttonVariants({ variant: "outline", className: "gap-2" }))}
              >
                <Pencil className="size-4" />
                تعديل
              </DialogTrigger>
              <DialogContent dir="rtl" className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>تعديل بيانات المريض</DialogTitle>
                </DialogHeader>
                <form onSubmit={updatePatient} className="space-y-4">
                  <div className="space-y-2">
                    <Label>اسم المريض</Label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الهاتف</Label>
                    <div className="flex gap-2" dir="ltr">
                      <span className="inline-flex items-center rounded-xl border bg-secondary px-3 text-sm font-semibold text-primary">
                        +963
                      </span>
                      <Input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="text-left"
                        required
                      />
                    </div>
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
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger
                className={cn(buttonVariants({ className: "gap-2" }))}
              >
                <Plus className="size-4" />
                إجراء جديد
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle>إضافة إجراء علاجي</DialogTitle>
                </DialogHeader>
                <form onSubmit={addProcedure} className="space-y-4">
                  <div className="space-y-2">
                    <Label>اسم الإجراء</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: زراعة سن / تقويم / حشو"
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
                      value={totalPrice}
                      onChange={(e) => setTotalPrice(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    حفظ الإجراء
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="anim-block space-y-3">
        <h2 className="text-xl font-bold">الإجراءات</h2>
        {procedures.map((proc) => (
          <Link
            key={proc.id}
            href={`/procedures/${proc.id}`}
            className="block rounded-2xl border bg-card/80 p-5 transition hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">{proc.name}</h3>
                  <Badge variant={proc.status === "finished" ? "secondary" : "default"}>
                    {proc.status === "finished" ? "مكتمل" : "نشط"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {proc.sessions_count} جلسة
                </p>
              </div>
              <div className="text-left text-sm" dir="ltr">
                <p>
                  الإجمالي:{" "}
                  <strong>{formatCurrency(Number(proc.total_price))}</strong>
                </p>
                <p className="text-emerald-700">
                  المدفوع: {formatCurrency(Number(proc.paid_total))}
                </p>
                <p className="font-bold text-accent-foreground">
                  المتبقي: {formatCurrency(Number(proc.remaining))}
                </p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (Number(proc.paid_total) / Math.max(1, Number(proc.total_price))) *
                      100
                  )}%`,
                }}
              />
            </div>
          </Link>
        ))}
        {!procedures.length && (
          <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
            لا توجد إجراءات بعد لهذا المريض
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف المريض"
        description="سيتم حذف المريض وجميع إجراءاته وجلساته نهائياً. لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف المريض"
        loading={loading}
        destructive
        onConfirm={deletePatient}
      />
    </AnimatedPage>
  );
}
