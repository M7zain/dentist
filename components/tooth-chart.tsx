"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { CHART_H, CHART_W, TOOTH_HITS } from "@/lib/tooth-layout";

type ToothChartProps = {
  selected: number[];
  onChange?: (teeth: number[]) => void;
  previouslyWorked?: number[];
  readOnly?: boolean;
};

export function ToothChart({
  selected,
  onChange,
  previouslyWorked = [],
  readOnly,
}: ToothChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(
    (fdi: number) => {
      if (readOnly || !onChange) return;
      onChange(
        selected.includes(fdi)
          ? selected.filter((t) => t !== fdi)
          : [...selected, fdi]
      );
    },
    [readOnly, onChange, selected]
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-[#e8e8e8] p-2 sm:p-3">
      <div className="mb-2 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
        <span className="font-semibold text-slate-700">مخطط الأسنان</span>
        <span>FDI — فك مفتوح</span>
      </div>

      <div
        ref={containerRef}
        className="relative mx-auto select-none"
        style={{ width: "100%", maxWidth: 320, aspectRatio: `${CHART_W} / ${CHART_H}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/dental-chart.png"
          alt="مخطط الأسنان"
          className="pointer-events-none absolute inset-0 h-full w-full object-fill"
          draggable={false}
        />

        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="absolute inset-0 h-full w-full touch-manipulation"
          style={{ pointerEvents: readOnly ? "none" : "auto" }}
          aria-label="اختيار الأسنان"
        >
          {TOOTH_HITS.map(({ fdi, x, y, r }) => {
            const isSelected = selected.includes(fdi);
            const isWorked =
              previouslyWorked.includes(fdi) && !isSelected;

            return (
              <circle
                key={fdi}
                cx={x}
                cy={y}
                r={r}
                fill={
                  isSelected
                    ? "rgba(20, 184, 166, 0.55)"
                    : isWorked
                      ? "rgba(74, 222, 128, 0.5)"
                      : "rgba(0,0,0,0.001)"
                }
                stroke={
                  isSelected
                    ? "#0f766e"
                    : isWorked
                      ? "#15803d"
                      : "transparent"
                }
                strokeWidth={isSelected || isWorked ? 2.5 : 0}
                className={cn(
                  !readOnly && "cursor-pointer",
                  !readOnly && "hover:fill-black/15"
                )}
                onPointerDown={(e) => {
                  e.preventDefault();
                  toggle(fdi);
                }}
                role="button"
                aria-label={`سن ${fdi}`}
                aria-pressed={isSelected}
              />
            );
          })}
        </svg>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-300/50 pt-2 text-[10px] text-muted-foreground">
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="size-3 rounded-full bg-teal-500/70 ring-2 ring-teal-800" />
            محدد ({selected.length})
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-3 rounded-full bg-green-400/70 ring-2 ring-green-700" />
            عُولج سابقاً
          </span>
        </div>
        <span>اضغط على السن</span>
      </div>
    </div>
  );
}
