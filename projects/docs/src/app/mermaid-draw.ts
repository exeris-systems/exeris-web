/** The part of Mermaid's API a diagram needs. */
export interface MermaidRenderer {
  render(id: string, source: string): Promise<{ svg: string }>;
}

/**
 * Renders `source` with `mermaid` and appends the SVG to `target`. Returns true when a diagram was
 * drawn. The SVG is parsed as HTML, not XML: Mermaid's labels are HTML inside foreignObject
 * (<br>, &nbsp;), which an XML parser rejects. DOMParser runs no script, and the nodes are
 * imported, not written as a string. On any failure nothing Mermaid rendered under `id` stays in
 * the document and the caller keeps showing the source.
 */
export async function drawDiagram(mermaid: MermaidRenderer, id: string, source: string, target: HTMLElement): Promise<boolean> {
  const doc = target.ownerDocument;
  try {
    const { svg } = await mermaid.render(id, source);
    const Parser = doc.defaultView?.DOMParser ?? DOMParser;
    const root = new Parser().parseFromString(svg, 'text/html').body.querySelector('svg');
    if (!root) return false;
    target.appendChild(doc.importNode(root, true));
    return true;
  } catch {
    doc.getElementById(id)?.remove();
    doc.getElementById(`d${id}`)?.remove();
    return false;
  }
}
