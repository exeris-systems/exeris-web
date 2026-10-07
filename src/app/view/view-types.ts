/**
 * The presentation IR as the site reads it: the wire shape of `view_*.json`
 * (`ViewJson { name, packageName, qualifiedName, view: ViewMetadata }`), field for field the
 * schema @exeris/codegen-ts parses (`ViewMetadataSchema`, `RegionMetadataSchema`,
 * `ComponentNodeMetadataSchema`, `BindingMetadataSchema`). The generator is the validator of
 * record: `npm run check:views` runs it over content/views.
 */

export type ViewKind = 'PAGE' | 'SECTION' | 'COMPONENT' | 'FRAGMENT';

export type BlockType =
  | 'HERO'
  | 'LIST'
  | 'GRID'
  | 'RICH_TEXT'
  | 'NAV'
  | 'SLOT'
  | 'CONTAINER'
  | 'CARD'
  | 'FORM'
  | 'IMAGE'
  | 'CUSTOM';

export type BindSource = 'ENTITY' | 'PROJECTION' | 'ACTION' | 'STATIC' | 'SLOT' | 'NONE';

export interface BindingMetadata {
  source?: BindSource;
  ref?: string;
  path?: string;
  expression?: string;
  language?: string;
}

export interface ComponentNode {
  type?: BlockType;
  customType?: string;
  binding?: BindingMetadata;
  /** Authored content. A simple block renders it as text; a CUSTOM block parses it as JSON. */
  props?: string;
  children?: ComponentNode[];
}

export interface RegionMetadata {
  slot?: string;
  components?: ComponentNode[];
}

export interface ViewMetadata {
  name: string;
  kind?: ViewKind;
  route?: string;
  title?: string;
  titleKey?: string;
  layout?: string;
  regions?: RegionMetadata[];
}

export interface ViewJson {
  name: string;
  packageName: string;
  qualifiedName: string;
  view: ViewMetadata;
}
