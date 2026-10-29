/** The shape of generated/index.json, written by scripts/docs/fetch-docs.mjs. */
export interface DocHeading {
  readonly level: number;
  readonly text: string;
  readonly id: string;
}

export interface DocPage {
  readonly id: string;
  readonly route: string;
  readonly section: string;
  readonly title: string;
  readonly description: string;
  readonly source: { readonly repo: string; readonly ref: string; readonly path: string; readonly url: string };
  /** The text of the page's second- and third-level headings, for search. */
  readonly keywords: string;
}

/** A page's content module, loaded with the page: its tree and its contents. */
export interface DocContent {
  readonly tree: readonly DocNode[];
  readonly headings: readonly DocHeading[];
}

export interface DocsIndex {
  readonly refs: Readonly<Record<string, string>>;
  readonly sections: readonly { readonly id: string; readonly label: string }[];
  readonly pages: readonly DocPage[];
}

/**
 * A node of a rendered document (scripts/docs/render.mjs toTree): an element with its tag,
 * attributes and children, or text.
 */
export type DocNode = string | DocElement;

export interface DocElement {
  readonly t: string;
  readonly a?: Readonly<Record<string, string>>;
  readonly c?: readonly DocNode[];
}
