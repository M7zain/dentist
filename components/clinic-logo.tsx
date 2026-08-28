import { cn } from "@/lib/utils";

export function ClinicLogo({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "size-9 text-lg rounded-xl",
    md: "size-10 text-xl rounded-2xl",
    lg: "size-16 text-3xl rounded-3xl",
  };

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-primary font-extrabold text-primary-foreground shadow-lg shadow-primary/25",
        sizes[size],
        className
      )}
      aria-hidden
    >
      ع
    </span>
  );
}
