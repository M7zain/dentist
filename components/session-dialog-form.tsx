"use client";

import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SessionDialogForm({
  title,
  submitLabel,
  loading,
  onSubmit,
  children,
}: {
  title: string;
  submitLabel: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <DialogContent dir="rtl" className="session-dialog sm:max-w-2xl">
      <DialogHeader className="shrink-0">
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <form
        onSubmit={onSubmit}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
          {children}
        </div>
        <div className="sticky bottom-0 shrink-0 border-t border-border/70 bg-popover pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
