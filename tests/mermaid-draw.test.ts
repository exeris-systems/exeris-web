// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { drawDiagram } from '../projects/docs/src/app/mermaid-draw';

/** An SVG as Mermaid writes it: HTML labels inside foreignObject, not well-formed XML. */
const SVG = '<svg id="ex-mermaid-1" xmlns="http://www.w3.org/2000/svg"><foreignObject><div>Kernel<br>core&nbsp;SPI</div></foreignObject></svg>';

describe('drawDiagram', () => {
  let target: HTMLElement;
  beforeEach(() => {
    document.body.innerHTML = '';
    target = document.createElement('div');
    document.body.appendChild(target);
  });

  it('appends the rendered SVG, HTML labels included, and reports it drawn', async () => {
    const drawn = await drawDiagram({ render: async () => ({ svg: SVG }) }, 'ex-mermaid-1', 'graph TD; A-->B', target);
    expect(drawn).toBe(true);
    const svg = target.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.textContent).toBe('Kernelcore SPI');
    expect(svg?.querySelector('br')).not.toBeNull();
  });

  it('removes what Mermaid left for a diagram that fails and draws nothing', async () => {
    for (const id of ['ex-mermaid-2', 'dex-mermaid-2']) {
      const el = document.createElement('div');
      el.id = id;
      document.body.appendChild(el);
    }
    const fail = { render: async () => Promise.reject(new Error('Parse error on line 3')) };
    expect(await drawDiagram(fail, 'ex-mermaid-2', 'graph TD; A[(x)]', target)).toBe(false);
    expect(document.getElementById('ex-mermaid-2')).toBeNull();
    expect(document.getElementById('dex-mermaid-2')).toBeNull();
    expect(target.childNodes).toHaveLength(0);
  });

  it('draws nothing when the result holds no svg element', async () => {
    expect(await drawDiagram({ render: async () => ({ svg: '<p>not a diagram</p>' }) }, 'ex-mermaid-3', 's', target)).toBe(false);
    expect(target.childNodes).toHaveLength(0);
  });

  it('does not run a script the result carries', async () => {
    (window as unknown as { hit?: boolean }).hit = false;
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>window.hit = true</script><g/></svg>';
    await drawDiagram({ render: async () => ({ svg }) }, 'ex-mermaid-4', 's', target);
    expect((window as unknown as { hit?: boolean }).hit).toBe(false);
  });
});
