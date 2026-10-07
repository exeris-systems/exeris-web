import { InjectionToken, type Type } from '@angular/core';

/**
 * The CUSTOM blocks a view may name: `customType` → standalone component. Each component takes
 * its parsed `props` as the `props` input; a block that lays out child nodes also takes the
 * node's `children` input. The registry is provided once, in the app config, so the renderer
 * does not import the blocks and the blocks may import the renderer.
 */
export type BlockRegistry = Readonly<Record<string, Type<unknown>>>;

export const BLOCK_REGISTRY = new InjectionToken<BlockRegistry>('BLOCK_REGISTRY');
