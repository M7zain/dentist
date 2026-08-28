"use client";

import { useMemo } from "react";
import { Odontogram } from "react-odontogram";
import type { ToothConditionGroup } from "react-odontogram";
import "react-odontogram/style.css";
import {
  CHART_IMAGE_SIZE,
  ODONTOGRAM_ALIGN,
  ODONTOGRAM_VIEWBOX,
} from "@/lib/odontogram-align";

type ToothChartProps = {
  selected: number[];
  onChange?: (teeth: number[]) => void;
  previouslyWorked?: number[];
  readOnly?: boolean;
};

function toToothId(fdi: number) {
  return `teeth-${fdi}`;
}

export function ToothChart({
  selected,
  onChange,
  previouslyWorked = [],
  readOnly,
}: ToothChartProps) {
  const defaultSelected = useMemo(
    () => selected.map(toToothId),
    [selected]
  );

  const workedConditions = useMemo<ToothConditionGroup[]>(() => {
    const workedOnly = previouslyWorked.filter((fdi) => !selected.includes(fdi));
    if (!workedOnly.length) return [];
    return [
      {
        label: "عُولج سابقاً",
        teeth: workedOnly.map(toToothId),
        fillColor: "rgba(74, 222, 128, 0.92)",
        outlineColor: "#15803d",
      },
    ];
  }, [previouslyWorked, selected]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-[#e8e8e8] p-2 sm:p-3">
      <div className="mb-2 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
        <span className="font-semibold text-slate-700">مخطط الأسنان</span>
        <span>FDI — فك مفتوح</span>
      </div>

      <div
        className="clinic-odontogram relative mx-auto overflow-hidden"
        style={{
          width: "100%",
          maxWidth: 320,
          aspectRatio: `${CHART_IMAGE_SIZE.w} / ${CHART_IMAGE_SIZE.h}`,
        }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: ODONTOGRAM_VIEWBOX.w,
            height: ODONTOGRAM_VIEWBOX.h,
            transform: `translate(${ODONTOGRAM_ALIGN.translateX}px, ${ODONTOGRAM_ALIGN.translateY}px) scale(${ODONTOGRAM_ALIGN.scaleX}, ${ODONTOGRAM_ALIGN.scaleY})`,
          }}
        >
          <Odontogram
            key={defaultSelected.join(",")}
            defaultSelected={defaultSelected}
            readOnly={readOnly}
            notation="FDI"
            layout="circle"
            showHalf="full"
            showTooltip={false}
            showLabels={false}
            teethConditions={workedConditions}
            colors={{
              darkBlue: "#0f766e",
              baseBlue: "#64748b",
              lightBlue: "rgba(20, 184, 166, 0.92)",
            }}
            onChange={(teeth) => {
              if (readOnly || !onChange) return;
              onChange(teeth.map((t) => Number(t.notations.fdi)));
            }}
            styles={{
              width: ODONTOGRAM_VIEWBOX.w,
              height: ODONTOGRAM_VIEWBOX.h,
            }}
          />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-300/50 pt-2 text-[10px] text-muted-foreground">
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="size-3 rounded-full bg-teal-500 ring-2 ring-teal-800" />
            محدد ({selected.length})
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-3 rounded-full bg-green-400 ring-2 ring-green-700" />
            عُولج سابقاً
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-3 rounded-full border border-slate-400 bg-white" />
            سليم
          </span>
        </div>
        {!readOnly && <span>اضغط على السن</span>}
      </div>
    </div>
  );
}
