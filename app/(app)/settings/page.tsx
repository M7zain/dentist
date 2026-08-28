"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AnimatedPage } from "@/components/animated-page";
import { SettingsSkeleton } from "@/components/page-skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";

export default function SettingsPage() {
  const [percentage, setPercentage] = useState("30");
  const [preview, setPreview] = useState(100000);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.dentist) {
          setPercentage(String(data.dentist.clinic_percentage));
        }
      })
      .finally(() => setInitialLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinic_percentage: Number(percentage) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "فشل الحفظ");
        return;
      }
      toast.success("تم حفظ نسبة العيادة");
    } finally {
      setLoading(false);
    }
  }

  const pct = Number(percentage) || 0;
  const clinicShare = (preview * pct) / 100;
  const dentistShare = preview - clinicShare;

  if (initialLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <AnimatedPage>
      <div className="anim-block">
        <h1 className="text-3xl font-extrabold">الإعدادات</h1>
        <p className="mt-1 text-muted-foreground">
          ضبط نسبة العيادة وتقسيم الإيرادات بين الطبيب والعيادة
        </p>
      </div>

      <form
        onSubmit={save}
        className="anim-block max-w-xl space-y-5 rounded-3xl border bg-card/80 p-6"
      >
        <div className="space-y-2">
          <Label>نسبة العيادة (%)</Label>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.1"
            dir="ltr"
            className="text-left"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            مثال: إذا كانت النسبة 30٪ فإن العيادة تأخذ 30٪ والطبيب 70٪ من كل دفعة
          </p>
        </div>

        <div className="space-y-2">
          <Label>معاينة على مبلغ افتراضي</Label>
          <Input
            type="number"
            min="0"
            dir="ltr"
            className="text-left"
            value={preview}
            onChange={(e) => setPreview(Number(e.target.value) || 0)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs text-muted-foreground">حصة الطبيب</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">
              {formatCurrency(dentistShare)}
            </p>
            <p className="text-xs text-muted-foreground">{(100 - pct).toFixed(1)}%</p>
          </div>
          <div className="rounded-2xl bg-accent/20 p-4">
            <p className="text-xs text-muted-foreground">حصة العيادة</p>
            <p className="mt-1 text-xl font-bold">{formatCurrency(clinicShare)}</p>
            <p className="text-xs text-muted-foreground">{pct.toFixed(1)}%</p>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          حفظ الإعدادات
        </Button>
      </form>
    </AnimatedPage>
  );
}
