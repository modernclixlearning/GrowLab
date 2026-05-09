/**
 * GrowLab shell components — barrel export.
 *
 * These components form the chrome of authenticated screens:
 *   - AppShell      → page wrapper (mobile container + BottomNav)
 *   - BottomNav     → 5-item tab bar with centered FAB
 *   - Fab           → circular accent action button
 *   - Eyebrow       → mono uppercase label
 *   - H1, H2, H3    → display headings (Sora)
 *   - SystemPulse   → animated SYSTEM ONLINE indicator
 */

export { AppShell } from './AppShell'
export type { AppShellProps } from './AppShell'

export { BottomNav } from './BottomNav'
export type { BottomNavProps } from './BottomNav'

export { Fab } from './Fab'
export type { FabProps } from './Fab'

export { Eyebrow } from './Eyebrow'
export type { EyebrowProps, EyebrowTone } from './Eyebrow'

export { H1, H2, H3 } from './Heading'

export { SystemPulse } from './SystemPulse'
export type { SystemPulseProps } from './SystemPulse'
