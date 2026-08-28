"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { LayoutDashboard, Users, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ClinicLogo } from "@/components/clinic-logo";

gsap.registerPlugin(useGSAP);

const links = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/patients", label: "المرضى", icon: Users },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

export function AppShell({
  children,
  dentistName,
}: {
  children: React.ReactNode;
  dentistName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".nav-item", {
        opacity: 0,
        y: 12,
        duration: 0.45,
        stagger: 0.06,
        ease: "power2.out",
      });
    },
    { scope: navRef }
  );

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
            <ClinicLogo size="md" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-base font-extrabold tracking-tight text-primary sm:text-lg">
                عيادة الأسنان
              </p>
              <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                {dentistName}
              </p>
            </div>
          </Link>

          <nav ref={navRef} className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "nav-item inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <Button variant="outline" size="sm" onClick={logout} className="shrink-0 gap-2">
            <LogOut className="size-4" />
            <span className="hidden sm:inline">خروج</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-8 md:pb-8">
        {children}
      </main>

      {/* Floating bottom app bar — mobile */}
      <div
        className="fixed inset-x-0 bottom-0 z-[100] md:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <nav
          aria-label="التنقل الرئيسي"
          className="mx-auto max-w-md px-4"
        >
          <div className="flex items-center justify-around gap-1 rounded-2xl border border-border/50 bg-card/95 p-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.08),0_8px_32px_rgba(13,148,136,0.12)] backdrop-blur-xl">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-[11px] font-semibold transition-all active:scale-95",
                    active
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "text-muted-foreground hover:bg-secondary/80"
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
