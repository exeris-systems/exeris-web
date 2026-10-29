import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Placeholder until the first content lands; the application is not deployed yet. */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section">
      <div class="ex-container">
        <h1>Exeris Lab</h1>
        <p>The benchmark evidence behind every figure Exeris quotes, rendered from the claims register and the published results at build time.</p>
      </div>
    </section>
  `,
})
export class HomePageComponent {}
