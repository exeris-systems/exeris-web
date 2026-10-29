import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { DocNode } from './doc-types';
import { MermaidComponent } from './mermaid.component';

/**
 * A rendered document, drawn from its tree with Angular templates: no HTML string is inserted, so
 * every attribute goes through Angular's own binding and URL sanitising. The tags and attributes
 * are those the build's allow-list keeps (scripts/docs/render.mjs SANITIZE); a node of any other
 * tag renders nothing.
 */
@Component({
  selector: 'ex-doc-content',
  imports: [NgTemplateOutlet, MermaidComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *ngTemplateOutlet="nodes; context: { $implicit: tree() }" />

    <ng-template #nodes let-list>
      @for (n of list; track $index) {
        <ng-container *ngTemplateOutlet="node; context: { $implicit: n }" />
      }
    </ng-template>

    <ng-template #node let-n>
      @if (isText(n)) {{{ n }}} @else {
        @switch (n.t) {
          @case ('h1') { <h1 [attr.id]="n.a?.id"><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></h1> }
          @case ('h2') { <h2 [attr.id]="n.a?.id"><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></h2> }
          @case ('h3') { <h3 [attr.id]="n.a?.id"><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></h3> }
          @case ('h4') { <h4 [attr.id]="n.a?.id"><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></h4> }
          @case ('h5') { <h5 [attr.id]="n.a?.id"><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></h5> }
          @case ('h6') { <h6 [attr.id]="n.a?.id"><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></h6> }
          @case ('p') { <p><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></p> }
          @case ('a') { <a [href]="n.a?.href"><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></a> }
          @case ('ul') { <ul><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></ul> }
          @case ('ol') { <ol [attr.start]="n.a?.start"><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></ol> }
          @case ('li') { <li><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></li> }
          @case ('blockquote') { <blockquote><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></blockquote> }
          @case ('pre') {
            @if (n.a?.class === 'ex-doc__diagram') {
              <ex-mermaid [source]="textOf(n)" />
            } @else {
              <pre [attr.class]="n.a?.class"><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></pre>
            }
          }
          @case ('code') { <code [attr.class]="n.a?.class"><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></code> }
          @case ('em') { <em><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></em> }
          @case ('strong') { <strong><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></strong> }
          @case ('del') { <del><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></del> }
          @case ('s') { <s><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></s> }
          @case ('sub') { <sub><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></sub> }
          @case ('sup') { <sup><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></sup> }
          @case ('kbd') { <kbd><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></kbd> }
          @case ('hr') { <hr /> }
          @case ('br') { <br /> }
          @case ('table') { <table><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></table> }
          @case ('thead') { <thead><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></thead> }
          @case ('tbody') { <tbody><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></tbody> }
          @case ('tr') { <tr><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></tr> }
          @case ('th') { <th [attr.align]="n.a?.align" [attr.colspan]="n.a?.colspan" [attr.rowspan]="n.a?.rowspan"><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></th> }
          @case ('td') { <td [attr.align]="n.a?.align" [attr.colspan]="n.a?.colspan" [attr.rowspan]="n.a?.rowspan"><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></td> }
          @case ('details') { <details [attr.open]="n.a?.open"><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></details> }
          @case ('summary') { <summary><ng-container *ngTemplateOutlet="nodes; context: { $implicit: n.c }" /></summary> }
        }
      }
    </ng-template>
  `,
})
export class DocContentComponent {
  readonly tree = input.required<readonly DocNode[]>();

  protected isText(n: DocNode): n is string {
    return typeof n === 'string';
  }

  /** The text of a node and its descendants: a diagram's source. */
  protected textOf(n: DocNode): string {
    return typeof n === 'string' ? n : (n.c ?? []).map((c) => this.textOf(c)).join('');
  }
}
