import { InjectionToken } from '@angular/core';
import type { SearchEntry } from './fuzzy';

export interface NavLink {
  readonly label: string;
  readonly href: string;
  readonly description?: string;
}

export interface NavItem {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly children?: readonly NavLink[];
}

export interface FooterColumn {
  readonly title: string;
  readonly links: readonly NavLink[];
}

/**
 * What the shared shell shows, supplied by each application: the shell renders it and imports
 * no application content, so exeris.eu, the docs and the lab share one navigation, footer and
 * palette while each names its own pages.
 */
export interface ShellConfig {
  readonly nav: readonly NavItem[];
  readonly github: string;
  readonly footer: {
    readonly tagline: string;
    readonly columns: readonly FooterColumn[];
    readonly legal: readonly string[];
  };
  /** The kernel release and the commit of this repository the build was made from. */
  readonly build: {
    readonly kernel: { readonly tag: string; readonly url: string };
    readonly siteSha: string | null;
  };
  /** The command palette's entries, built at build time. */
  readonly searchIndex: readonly SearchEntry[];
}

export const SHELL_CONFIG = new InjectionToken<ShellConfig>('SHELL_CONFIG');
