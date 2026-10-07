/** Prop shapes shared by several blocks. */

export type Tone = 'flow' | 'cyan' | 'slate' | 'ok' | 'err' | 'evidence' | 'muted';

export interface Cta {
  readonly label: string;
  readonly href: string;
  readonly variant?: 'solid' | 'primary' | 'outline';
}

export interface Badge {
  readonly label: string;
  readonly tone?: Tone;
}

export interface Crumb {
  readonly label: string;
  readonly href?: string;
}

/** A tone as the CSS custom property the edge, bullet and number colours read. */
export function toneVar(tone: Tone | undefined): string | null {
  switch (tone) {
    case 'flow':
      return 'var(--ex-flow-blue-text)';
    case 'cyan':
      return 'var(--ex-flow-cyan)';
    case 'slate':
      return 'var(--ex-fg-2)';
    case 'ok':
      return 'var(--ex-ok)';
    case 'err':
      return 'var(--ex-err)';
    case 'evidence':
      return 'var(--ex-evidence)';
    case 'muted':
      return 'var(--ex-fg-4)';
    default:
      return null;
  }
}

/** The tag modifier class for a tone. */
export function tagClass(tone: Tone | undefined): string {
  switch (tone) {
    case 'flow':
      return 'ex-tag ex-tag--flow';
    case 'cyan':
      return 'ex-tag ex-tag--cyan';
    case 'ok':
      return 'ex-tag ex-tag--ok';
    case 'err':
      return 'ex-tag ex-tag--err';
    case 'evidence':
      return 'ex-tag ex-tag--evidence';
    case 'muted':
      return 'ex-tag ex-tag--muted';
    default:
      return 'ex-tag';
  }
}

export function btnClass(cta: Cta, size: 'lg' | 'sm' | '' = 'lg'): string {
  const variant = cta.variant === 'solid' ? ' ex-btn--solid' : cta.variant === 'primary' ? ' ex-btn--primary' : '';
  return `ex-btn${variant}${size ? ` ex-btn--${size}` : ''}`;
}

/** Two-digit step labels (01, 02, …) from a position, so step numbers are never typed. */
export function stepLabel(index: number): string {
  return String(index + 1).padStart(2, '0');
}
