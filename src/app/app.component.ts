import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommandPaletteComponent } from './shell/command-palette.component';
import { FooterComponent } from './shell/footer.component';
import { TopNavComponent } from './shell/top-nav.component';

/** The shell every page shares: skip link, top navigation, the routed page, footer, palette. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopNavComponent, FooterComponent, CommandPaletteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="ex-skip" href="#content" (click)="skip($event)">Skip to content</a>
    <ex-top-nav />
    <div id="content" tabindex="-1">
      <router-outlet />
    </div>
    <ex-footer />
    <ex-command-palette />
  `,
})
export class AppComponent {
  /** Focuses the page content; a bare "#content" would resolve against the base href. */
  protected skip(event: Event): void {
    event.preventDefault();
    document.getElementById('content')?.focus();
  }
}
