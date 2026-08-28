"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClinicLogo } from "@/components/clinic-logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

gsap.registerPlugin(useGSAP);

export default function LoginPage() {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [username, setUsername] = useState("rawan");
  const [password, setPassword] = useState("dentist123");
  const [loading, setLoading] = useState(false);

  useGSAP(
    () => {
      gsap.from(".login-card", {
        opacity: 0,
        y: 30,
        scale: 0.96,
        duration: 0.7,
        ease: "power3.out",
      });
      gsap.from(".login-brand", {
        opacity: 0,
        y: -16,
        duration: 0.6,
        delay: 0.15,
        ease: "power2.out",
      });
    },
    { scope: ref }
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "فشل تسجيل الدخول");
        return;
      }
      toast.success(`مرحباً ${data.dentist.name}`);
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      ref={ref}
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-20 top-10 size-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -left-16 bottom-10 size-80 rounded-full bg-accent/25 blur-3xl" />
      </div>

      <div className="login-card relative w-full max-w-md rounded-3xl border border-border/70 bg-card/90 p-8 shadow-2xl shadow-primary/10 backdrop-blur-xl">
        <div className="login-brand mb-8 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <ClinicLogo size="lg" className="shadow-xl shadow-primary/30" />
          </div>
          <h1 className="text-3xl font-extrabold text-primary">عيادة الأسنان</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            سجّل دخولك لإدارة المرضى والإجراءات
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input
              id="username"
              type="text"
              dir="ltr"
              className="text-left"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              dir="ltr"
              className="text-left"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "دخول"}
          </Button>
        </form>
      </div>
    </div>
  );
}
