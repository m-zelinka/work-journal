import type { HTMLAttributes } from 'react'
import { cva, cx, type VariantProps } from '~/utils/misc'

export const badgeVariants = cva({
  base: 'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  variants: {
    variant: {
      default: 'border-transparent bg-primary text-primary-foreground shadow',
      secondary: 'border-transparent bg-secondary text-secondary-foreground',
      destructive:
        'border-transparent bg-destructive text-destructive-foreground shadow',
      outline: 'text-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cx(badgeVariants({ variant }), className)} {...props} />
  )
}
