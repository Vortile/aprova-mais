import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLockupSize = "sm" | "lg";

const sizeClasses: Record<
  BrandLockupSize,
  { wrapper: string; logo: string; label: string }
> = {
  sm: {
    wrapper: "gap-2.5",
    logo: "h-8 w-8",
    label: "text-lg",
  },
  lg: {
    wrapper: "gap-3",
    logo: "h-11 w-11",
    label: "text-2xl",
  },
};

interface BrandLockupProps {
  size?: BrandLockupSize;
  className?: string;
  labelClassName?: string;
  logoClassName?: string;
  priority?: boolean;
}

export function BrandLockup({
  size = "sm",
  className,
  labelClassName,
  logoClassName,
  priority = false,
}: BrandLockupProps) {
  const styles = sizeClasses[size];

  return (
    <span className={cn("inline-flex items-center", styles.wrapper, className)}>
      <Image
        src="/logo-blue.png"
        alt=""
        aria-hidden="true"
        width={44}
        height={44}
        priority={priority}
        className={cn("shrink-0", styles.logo, logoClassName)}
      />
      <span
        className={cn(
          "font-semibold leading-none text-primary",
          styles.label,
          labelClassName,
        )}
      >
        Aprova<span className="font-extrabold text-tertiary">+</span>
      </span>
    </span>
  );
}
