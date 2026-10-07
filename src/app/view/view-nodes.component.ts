import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { BLOCK_REGISTRY } from './block-registry';
import type { BlockType, ComponentNode } from './view-types';

interface RenderedNode {
  readonly type: BlockType;
  readonly node: ComponentNode;
  readonly text: string | null;
  readonly component: unknown;
  readonly inputs: Record<string, unknown>;
}

/**
 * Renders a list of presentation-IR nodes.
 *
 * Simple blocks get the element and classes @exeris/codegen-ts view-gen emits for them
 * (`data-block` attribute, `exeris-*` marker class and utilities), so a page rendered here and a
 * page the generator emits carry the same markup. A CUSTOM block resolves through the block
 * registry and receives its `props` parsed as JSON, plus its children when it has any.
 */
@Component({
  selector: 'ex-view-nodes',
  imports: [NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (n of rendered(); track $index) {
      @switch (n.type) {
        @case ('CUSTOM') {
          <ng-container *ngComponentOutlet="$any(n.component); inputs: n.inputs" />
        }
        @case ('HERO') {
          <section class="exeris-hero bg-exeris-primary text-white p-8 rounded-md" data-block="HERO">
            @if (n.text) { {{ n.text }} }
            <ex-view-nodes [nodes]="n.node.children ?? []" />
          </section>
        }
        @case ('CARD') {
          <article class="exeris-card p-4" data-block="CARD">
            @if (n.text) { {{ n.text }} }
            <ex-view-nodes [nodes]="n.node.children ?? []" />
          </article>
        }
        @case ('GRID') {
          <div class="exeris-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-block="GRID">
            @if (n.text) { {{ n.text }} }
            <ex-view-nodes [nodes]="n.node.children ?? []" />
          </div>
        }
        @case ('RICH_TEXT') {
          <div class="exeris-rich-text prose dark:prose-invert max-w-none" data-block="RICH_TEXT">
            @if (n.text) { {{ n.text }} }
            <ex-view-nodes [nodes]="n.node.children ?? []" />
          </div>
        }
        @case ('IMAGE') {
          <figure class="exeris-image" data-block="IMAGE">
            @if (n.text) { {{ n.text }} }
            <ex-view-nodes [nodes]="n.node.children ?? []" />
          </figure>
        }
        @default {
          <div class="exeris-container" data-block="CONTAINER">
            @if (n.text) { {{ n.text }} }
            <ex-view-nodes [nodes]="n.node.children ?? []" />
          </div>
        }
      }
    }
  `,
})
export class ViewNodesComponent {
  readonly nodes = input.required<readonly ComponentNode[]>();

  private readonly registry = inject(BLOCK_REGISTRY);

  protected readonly rendered = computed<RenderedNode[]>(() =>
    this.nodes().map((node) => {
      const type = node.type ?? 'CONTAINER';
      if (type === 'CUSTOM') {
        const name = node.customType ?? '';
        const component = this.registry[name];
        if (!component) throw new Error(`View IR: no CUSTOM block registered as "${name}"`);
        const inputs: Record<string, unknown> = { props: node.props ? JSON.parse(node.props) : {} };
        if (node.children?.length) inputs['children'] = node.children;
        return { type, node, text: null, component, inputs };
      }
      if (type === 'LIST' || type === 'NAV' || type === 'FORM' || type === 'SLOT') {
        throw new Error(`View IR: block type ${type} is not used by this site`);
      }
      return { type, node, text: node.props ?? null, component: null, inputs: {} };
    }),
  );
}
