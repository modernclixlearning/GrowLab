/**
 * GrowLab Heading components (H1, H2, H3)
 *
 * Display typography using Sora. Sizes/weights mirror the prototype's
 * `.gl-h1` / `.gl-h2` / `.gl-h3`.
 *
 *  - H1: 34px / weight 800 / tracking tight
 *  - H2: 22px / weight 700 / tracking tight
 *  - H3: 17px / weight 700
 *
 * Each component is a thin wrapper over the matching native element and
 * accepts `className` passthrough plus any standard HTML heading props.
 */

import type { HTMLAttributes, ReactNode } from 'react'

interface BaseHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode
}

function joinClasses(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ')
}

export function H1({ children, className, ...rest }: BaseHeadingProps) {
  return (
    <h1
      {...rest}
      className={joinClasses(
        'font-display text-[34px] font-extrabold leading-[1.05] tracking-[-0.02em] text-fg',
        className,
      )}
    >
      {children}
    </h1>
  )
}

export function H2({ children, className, ...rest }: BaseHeadingProps) {
  return (
    <h2
      {...rest}
      className={joinClasses(
        'font-display text-[22px] font-bold leading-[1.15] tracking-[-0.01em] text-fg',
        className,
      )}
    >
      {children}
    </h2>
  )
}

export function H3({ children, className, ...rest }: BaseHeadingProps) {
  return (
    <h3
      {...rest}
      className={joinClasses(
        'font-display text-[17px] font-bold leading-[1.2] text-fg',
        className,
      )}
    >
      {children}
    </h3>
  )
}
