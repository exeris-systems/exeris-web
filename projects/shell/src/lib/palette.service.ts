import { Injectable, signal } from '@angular/core';

/** Open state of the command palette, shared by the nav button and the global shortcut. */
@Injectable({ providedIn: 'root' })
export class PaletteService {
  readonly open = signal(false);

  /** The element focused before the palette opened, focused again when it closes. */
  returnFocus: HTMLElement | null = null;

  show(): void {
    if (typeof document !== 'undefined') {
      this.returnFocus = document.activeElement as HTMLElement | null;
    }
    this.open.set(true);
  }

  hide(): void {
    this.open.set(false);
  }
}
