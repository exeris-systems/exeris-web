/**
 * The CUSTOM block names, kept free of Angular imports so the content checks can read them.
 * `index.ts` maps each to its component and the type system keeps the two lists equal.
 */
export const CUSTOM_BLOCKS = [
  'ExBento',
  'ExCallout',
  'ExCapMatrix',
  'ExCardGrid',
  'ExCodePane',
  'ExConsumerTable',
  'ExContact',
  'ExEvidenceStrip',
  'ExFinalCta',
  'ExHomeHero',
  'ExLab',
  'ExLayerBreakdown',
  'ExPageHeader',
  'ExPlatformMap',
  'ExPricingTiers',
  'ExRepoGrid',
  'ExSectionHead',
  'ExSkuCards',
  'ExSkuComposition',
  'ExSkuHeader',
  'ExStepGrid',
  'ExTierDeep',
  'ExTwoLevels',
  'ExWallDiagram',
] as const;

export type CustomBlockName = (typeof CUSTOM_BLOCKS)[number];

/** Blocks that lay out the node's children; no other CUSTOM block may have children. */
export const BLOCKS_WITH_CHILDREN: readonly CustomBlockName[] = ['ExTierDeep'];
