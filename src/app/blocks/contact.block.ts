import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CONTACT_EMAIL, CONTACT_HREF } from '../../content/site';

export interface ContactProps {
  readonly id?: string;
  readonly eyebrow?: string;
  readonly title: string;
  readonly body: string;
  readonly label: string;
}

/** The contact band; the address comes from the one site constant. */
@Component({
  selector: 'ex-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ex-section ex-section--alt" [attr.id]="props().id ?? 'contact'">
      <div class="ex-container ex-contact">
        <div>
          @if (props().eyebrow) {
            <p class="ex-eyebrow">{{ props().eyebrow }}</p>
          }
          <h2>{{ props().title }}</h2>
          <p>{{ props().body }}</p>
        </div>
        <div class="ex-contact__action">
          <a class="ex-btn ex-btn--solid ex-btn--lg" [href]="href">{{ props().label }} →</a>
          <p class="ex-mono">{{ email }}</p>
        </div>
      </div>
    </section>
  `,
})
export class ContactComponent {
  readonly props = input.required<ContactProps>();
  protected readonly email = CONTACT_EMAIL;
  protected readonly href = CONTACT_HREF;
}
