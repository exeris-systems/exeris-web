/**
 * The CUSTOM block names, kept free of Angular imports so the content checks can read them.
 * `customBlocks` in exeris-codegen.json maps each to its component, and `npm run check:content`
 * fails when the two lists differ.
 */
export const CUSTOM_BLOCKS = [
  'ExBento',
  'ExCallout',
  'ExCapMatrix',
  'ExCardGrid',
  'ExCodeExample',
  'ExCodePane',
  'ExCodeSteps',
  'ExConsumerTable',
  'ExCoordinates',
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
  'ExStepGrid',
  'ExTierDeep',
  'ExTwoLevels',
  'ExWallDiagram',
] as const;

export type CustomBlockName = (typeof CUSTOM_BLOCKS)[number];

/** Blocks that lay out the node's children; no other CUSTOM block may have children. */
export const BLOCKS_WITH_CHILDREN: readonly CustomBlockName[] = ['ExTierDeep'];
