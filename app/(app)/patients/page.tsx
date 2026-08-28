"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Plus, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AnimatedPage } from "@/components/animated-page";
import { PatientsSkeleton } from "@/components/page-skeletons";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toWhatsAppLink } from "@/lib/format";
import type { Patient } from "@/lib/types";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  async function load(search = q) {
    const res = await fetch(`/api/patients?q=${encodeURIComponent(search)}`);
    const data = await res.json();
    setPatients(data.patients || []);
    setInitialLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addPatient(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: phone || "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "فشل الإضافة");
        return;
      }
      toast.success("تمت إضافة المريض");
      setOpen(false);
      setName("");
      setPhone("");
      await load();
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatedPage>
      {initialLoading ? (
        <PatientsSkeleton />
      ) : (
        <>
      <div className="anim-block flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">المرضى</h1>
          <p className="mt-1 text-muted-foreground">
            إدارة ملفات المرضى والتواصل عبر واتساب
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            className={cn(buttonVariants({ className: "gap-2" }))}
          >
            <UserPlus className="size-4" />
            مريض جديد
          </DialogTrigger>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة مريض جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={addPatient} className="space-y-4">
              <div className="space-y-2">
                <Label>اسم المريض</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: محمد علي"
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9xxxxxxxx"
                    className="text-left"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  الرقم السوري يُضاف تلقائياً ببادئة +963
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <Plus className="size-4" />
                حفظ المريض
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="anim-block relative">
        <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pr-10"
          placeholder="بحث بالاسم أو الرقم..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
      </div>

      <div className="anim-block grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <Link href={`/patients/${patient.id}`} className="block">
              <h3 className="text-lg font-bold">{patient.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                {patient.phone}
              </p>
            </Link>
            <div className="mt-4 flex gap-2">
              <Link
                href={`/patients/${patient.id}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "flex-1"
                )}
              >
                فتح الملف
              </Link>
              <a
                href={toWhatsAppLink(patient.phone)}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "gap-1 bg-[#25D366] hover:bg-[#1ebe57]"
                )}
              >
                <MessageCircle className="size-4" />
                واتساب
              </a>
            </div>
          </div>
        ))}
        {!patients.length && (
          <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
            لا يوجد مرضى بعد — ابدأ بإضافة أول مريض
          </div>
        )}
      </div>
        </>
      )}
    </AnimatedPage>
  );
}
