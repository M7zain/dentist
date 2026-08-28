"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Banknote,
  Users,
  Stethoscope,
  CalendarCheck,
  Building2,
  UserRound,
} from "lucide-react";
import { AnimatedPage } from "@/components/animated-page";
import { DashboardSkeleton } from "@/components/page-skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type StatsResponse = {
  range: string;
  from: string;
  to: string;
  clinic_percentage: number;
  stats: {
    earned: number;
    clinic_share: number;
    dentist_share: number;
    new_patients: number;
    total_patients: number;
    active_procedures: number;
    finished_procedures: number;
    sessions: number;
    today: number;
    week: number;
    month: number;
  };
  charts: {
    daily: { day: string; total: number }[];
    topProcedures: { name: string; total: number; sessions: number }[];
  };
};

const ranges = [
  { id: "day", label: "اليوم" },
  { id: "week", label: "هذا الأسبوع" },
  { id: "month", label: "هذا الشهر" },
  { id: "custom", label: "مخصص" },
] as const;

export default function DashboardPage() {
  const [range, setRange] = useState<(typeof ranges)[number]["id"]>("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ range });
    if (range === "custom" && from && to) {
      params.set("from", from);
      params.set("to", to);
    }
    const res = await fetch(`/api/stats?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [range, from, to]);

  useEffect(() => {
    if (range !== "custom") load();
  }, [range, load]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!data) return null;

  const cards = [
    {
      label: "إيراد الفترة",
      value: formatCurrency(data.stats.earned),
      icon: Banknote,
      tone: "from-primary/20 to-primary/5",
    },
    {
      label: "حصة الطبيب",
      value: formatCurrency(data.stats.dentist_share),
      icon: UserRound,
      tone: "from-emerald-400/25 to-emerald-400/5",
    },
    {
      label: "حصة العيادة",
      value: formatCurrency(data.stats.clinic_share),
      icon: Building2,
      tone: "from-accent/30 to-accent/5",
    },
    {
      label: "مرضى جدد",
      value: formatNumber(data.stats.new_patients),
      icon: Users,
      tone: "from-sky-400/25 to-sky-400/5",
    },
    {
      label: "إجراءات نشطة",
      value: formatNumber(data.stats.active_procedures),
      icon: Stethoscope,
      tone: "from-teal-400/25 to-teal-400/5",
    },
    {
      label: "جلسات الفترة",
      value: formatNumber(data.stats.sessions),
      icon: CalendarCheck,
      tone: "from-cyan-400/25 to-cyan-400/5",
    },
  ];

  const summaryItems = [
    { label: "نسبة العيادة", value: `${data.clinic_percentage}%` },
    { label: "إجمالي المرضى", value: formatNumber(data.stats.total_patients) },
    {
      label: "إجراءات مكتملة",
      value: formatNumber(data.stats.finished_procedures),
    },
  ];

  return (
    <AnimatedPage className="space-y-4 sm:space-y-6">
      <div className="anim-block space-y-3 sm:space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            لوحة التحكم
          </h1>
          <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
            نظرة حيّة على الإيرادات والمرضى والإجراءات
          </p>
        </div>

        <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ranges.map((r) => (
              <Button
                key={r.id}
                size="sm"
                variant={range === r.id ? "default" : "outline"}
                onClick={() => setRange(r.id)}
                className="shrink-0 rounded-full px-4"
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {range === "custom" && (
        <div className="anim-block space-y-3 rounded-2xl border bg-card/70 p-4 sm:flex sm:flex-wrap sm:items-end sm:gap-3">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-3">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs text-muted-foreground">من</p>
              <Input
                type="date"
                dir="ltr"
                className="w-full"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs text-muted-foreground">إلى</p>
              <Input
                type="date"
                dir="ltr"
                className="w-full"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={load} disabled={!from || !to} className="w-full sm:w-auto">
            تطبيق الفلتر
          </Button>
        </div>
      )}

      <div className="anim-block grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: "اليوم", value: data.stats.today },
          { label: "الأسبوع", value: data.stats.week },
          { label: "الشهر", value: data.stats.month },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 to-transparent p-3 sm:p-4"
          >
            <p className="text-[11px] text-muted-foreground sm:text-sm">
              {item.label}
            </p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-primary sm:mt-1 sm:text-2xl">
              {formatCurrency(item.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={cn(
                "anim-block rounded-2xl border border-border/70 bg-gradient-to-br p-3.5 shadow-sm sm:p-5",
                card.tone
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    {card.label}
                  </p>
                  <p className="mt-1 text-base font-extrabold tabular-nums sm:mt-2 sm:text-2xl">
                    {card.value}
                  </p>
                </div>
                <span className="shrink-0 rounded-xl bg-white/70 p-1.5 text-primary shadow-sm sm:p-2">
                  <Icon className="size-4 sm:size-5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="anim-block grid gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border bg-card/80 p-4 sm:p-5 lg:col-span-3">
          <h2 className="mb-3 text-base font-bold sm:mb-4 sm:text-lg">
            منحنى الإيرادات
          </h2>
          <div className="h-52 sm:h-64 md:h-72" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.charts.daily}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="earn" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="oklch(0.52 0.12 195)"
                      stopOpacity={0.45}
                    />
                    <stop
                      offset="100%"
                      stopColor="oklch(0.52 0.12 195)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.88 0.03 185)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                  tickMargin={8}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  width={40}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                  }
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                  contentStyle={{ direction: "rtl", borderRadius: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="oklch(0.52 0.12 195)"
                  fill="url(#earn)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card/80 p-4 sm:p-5 lg:col-span-2">
          <h2 className="mb-3 text-base font-bold sm:mb-4 sm:text-lg">
            أعلى الإجراءات إيراداً
          </h2>

          <div className="space-y-2 md:hidden">
            {data.charts.topProcedures.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                لا توجد بيانات في هذه الفترة
              </p>
            ) : (
              data.charts.topProcedures.map((proc, index) => (
                <div
                  key={proc.name}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{proc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(proc.sessions)} جلسة
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 text-xs font-bold tabular-nums text-primary sm:text-sm">
                    {formatCurrency(proc.total)}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="hidden h-72 md:block" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.charts.topProcedures}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.88 0.03 185)"
                />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                  contentStyle={{ direction: "rtl", borderRadius: 12 }}
                />
                <Bar
                  dataKey="total"
                  fill="oklch(0.68 0.14 155)"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="anim-block grid grid-cols-3 gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-3 sm:gap-3 sm:p-5">
        {summaryItems.map((item) => (
          <div key={item.label} className="text-center sm:text-right">
            <p className="text-[10px] text-muted-foreground sm:text-sm">
              {item.label}
            </p>
            <p className="mt-0.5 text-sm font-bold sm:mt-1 sm:text-base">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </AnimatedPage>
  );
}
