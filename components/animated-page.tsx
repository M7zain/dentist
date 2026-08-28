"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

export function AnimatedPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".anim-block", {
          opacity: 0,
          y: 22,
          duration: 0.55,
          stagger: 0.08,
          ease: "power3.out",
        });
      });
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={cn("space-y-6", className)}>
      {children}
    </div>
  );
}
