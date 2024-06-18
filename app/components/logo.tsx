import { cn } from "~/utils/misc";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="currentColor"
      className={cn("text-cyan-600", className)}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M100 0H0l100 100H0l100 100h100L100 100h100L100 0Z"
      />
    </svg>
  );
}
