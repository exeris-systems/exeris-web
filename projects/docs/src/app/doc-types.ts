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
  readonly headings: readonly DocHeading[];
}

export interface DocsIndex {
  readonly refs: Readonly<Record<string, string>>;
  readonly sections: readonly { readonly id: string; readonly label: string }[];
  readonly pages: readonly DocPage[];
}
