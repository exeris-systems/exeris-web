import type { BlockRegistry } from '../view/block-registry';
import { BentoComponent } from './bento.block';
import { CalloutComponent } from './callout.block';
import { CapMatrixComponent } from './cap-matrix.block';
import { CardGridComponent } from './card-grid.block';
import { CodePaneComponent } from './code-pane.block';
import { ConsumerTableComponent } from './consumer-table.block';
import { ContactComponent } from './contact.block';
import { EvidenceStripComponent } from './evidence-strip.block';
import { FinalCtaComponent } from './final-cta.block';
import { HomeHeroComponent } from './home-hero.block';
import { LabComponent } from './lab.block';
import { LayerBreakdownComponent } from './layer-breakdown.block';
import { PageHeaderComponent } from './page-header.block';
import { PlatformMapComponent } from './platform-map.block';
import { PricingTiersComponent } from './pricing-tiers.block';
import { RepoGridComponent } from './repo-grid.block';
import { SectionHeadComponent } from './section-head.block';
import { SkuCardsComponent } from './sku-cards.block';
import { SkuCompositionComponent } from './sku-composition.block';
import { SkuHeaderComponent } from './sku-header.block';
import { StepGridComponent } from './step-grid.block';
import { TierDeepComponent } from './tier-deep.block';
import { TwoLevelsComponent } from './two-levels.block';
import { WallDiagramComponent } from './wall-diagram.block';
import type { CustomBlockName } from './names';

/**
 * Every CUSTOM block a view may name. The key is the IR's `customType`; its kebab-case form is
 * the component's selector, which is the element @exeris/codegen-ts view-gen emits for the node.
 */
export const BLOCKS = {
  ExBento: BentoComponent,
  ExCallout: CalloutComponent,
  ExCapMatrix: CapMatrixComponent,
  ExCardGrid: CardGridComponent,
  ExCodePane: CodePaneComponent,
  ExConsumerTable: ConsumerTableComponent,
  ExContact: ContactComponent,
  ExEvidenceStrip: EvidenceStripComponent,
  ExFinalCta: FinalCtaComponent,
  ExHomeHero: HomeHeroComponent,
  ExLab: LabComponent,
  ExLayerBreakdown: LayerBreakdownComponent,
  ExPageHeader: PageHeaderComponent,
  ExPlatformMap: PlatformMapComponent,
  ExPricingTiers: PricingTiersComponent,
  ExRepoGrid: RepoGridComponent,
  ExSectionHead: SectionHeadComponent,
  ExSkuCards: SkuCardsComponent,
  ExSkuComposition: SkuCompositionComponent,
  ExSkuHeader: SkuHeaderComponent,
  ExStepGrid: StepGridComponent,
  ExTierDeep: TierDeepComponent,
  ExTwoLevels: TwoLevelsComponent,
  ExWallDiagram: WallDiagramComponent,
} satisfies BlockRegistry & Record<CustomBlockName, unknown>;
