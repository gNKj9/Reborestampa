import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

type Variant = "primary" | "accent" | "outline" | "ghost";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-accent",
  accent: "bg-accent text-paper hover:bg-accent-deep",
  outline:
    "border border-ink/40 text-ink hover:border-ink hover:bg-ink hover:text-paper",
  ghost: "text-ink hover:text-accent",
};

const sizes: Record<Size, string> = {
  sm: "px-3.5 py-2 text-[0.78rem] sm:px-4 sm:text-[0.8rem]",
  md: "px-6 py-3 text-[0.875rem]",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

type ButtonLinkProps = {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
    >
      {children}
    </Link>
  );
}
