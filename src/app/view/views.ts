/**
 * The authored views rendered by the site's IR renderer. Every `content/views/view_*.json`
 * except the generated pages' views is listed here; a test keeps this list and the directory
 * equal.
 */
import ai from '../../../content/views/view_ai.json';
import capabilities from '../../../content/views/view_capabilities.json';
import docs from '../../../content/views/view_docs.json';
import home from '../../../content/views/view_home.json';
import lab from '../../../content/views/view_lab.json';
import platform from '../../../content/views/view_platform.json';
import pricing from '../../../content/views/view_pricing.json';
import skuApiGateway from '../../../content/views/view_sku-api-gateway.json';
import skuBotBlocker from '../../../content/views/view_sku-bot-blocker.json';
import skuIdp from '../../../content/views/view_sku-idp.json';
import skus from '../../../content/views/view_skus.json';
import spring from '../../../content/views/view_spring.json';
import type { ViewJson } from './view-types';

export const RENDERED_VIEWS: readonly ViewJson[] = [
  home,
  platform,
  capabilities,
  skus,
  skuApiGateway,
  skuIdp,
  skuBotBlocker,
  spring,
  ai,
  pricing,
  docs,
  lab,
] as ViewJson[];

/**
 * Views whose page is the component @exeris/codegen-ts emits. A view qualifies when every node
 * is a simple block the generator renders on its own (no CUSTOM block).
 */
export const GENERATED_VIEWS = ['not-found'] as const;

/** The route path of a view, as the generator derives it: `route` without leading slashes. */
export function routePath(view: ViewJson): string {
  return (view.view.route ?? view.view.name).replace(/^\/+/, '');
}
