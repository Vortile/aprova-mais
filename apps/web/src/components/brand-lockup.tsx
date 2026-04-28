import Image from "next/image";

interface BrandLockupProps {
  className?: string;
  labelClassName?: string;
  logoClassName?: string;
  priority?: boolean;
}

export function BrandLockup({
  className,
  labelClassName,
  logoClassName,
  priority = false,
}: BrandLockupProps) {
  return (
    <span
      className={["inline-flex items-center gap-3", className]
        .filter(Boolean)
        .join(" ")}
    >
      <Image
        src="/logo-blue.png"
        alt=""
        aria-hidden="true"
        width={40}
        height={40}
        priority={priority}
        className={["h-8 w-8 shrink-0", logoClassName]
          .filter(Boolean)
          .join(" ")}
      />
      <span
        className={["leading-none text-primary", labelClassName]
          .filter(Boolean)
          .join(" ")}
      >
        Aprova<span className="font-extrabold text-tertiary">+</span>
      </span>
    </span>
  );
}
