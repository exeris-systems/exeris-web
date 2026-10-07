/** A token of a code sample: its kit token class (`exeris-code-<cls>`) and text. */
export interface CodeToken {
  readonly cls: 'kw' | 'an' | 'ty' | 'str' | 'num' | 'cm' | 'fn' | 'pn' | null;
  readonly text: string;
}

const JAVA_KW = new Set([
  'public', 'private', 'protected', 'final', 'class', 'record', 'interface', 'return', 'new', 'this',
  'static', 'void', 'import', 'package', 'var', 'if', 'else', 'implements', 'extends',
]);

/**
 * A deliberately small highlighter for the hand-written samples on the site (Java and YAML).
 * Comments, strings, annotations, keywords, capitalised type names and YAML keys are coloured;
 * everything else is plain text.
 */
export function highlight(code: string, lang: string): CodeToken[][] {
  return code.split('\n').map((line) => (lang === 'yaml' ? yamlLine(line) : javaLine(line)));
}

function javaLine(line: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  const re = /(\/\/.*$)|("(?:[^"\\]|\\.)*")|(@[A-Za-z]+)|([A-Za-z_][A-Za-z0-9_]*)(?=\s*\()|([A-Za-z_][A-Za-z0-9_]*)|([{}()[\];,.<>=])/g;
  let last = 0;
  for (const m of line.matchAll(re)) {
    if (m.index > last) tokens.push({ cls: null, text: line.slice(last, m.index) });
    const [t] = m;
    if (m[1]) tokens.push({ cls: 'cm', text: t });
    else if (m[2]) tokens.push({ cls: 'str', text: t });
    else if (m[3]) tokens.push({ cls: 'an', text: t });
    else if (m[4]) tokens.push({ cls: JAVA_KW.has(t) ? 'kw' : 'fn', text: t });
    else if (m[5]) tokens.push({ cls: JAVA_KW.has(t) ? 'kw' : /^[A-Z]/.test(t) ? 'ty' : null, text: t });
    else tokens.push({ cls: 'pn', text: t });
    last = m.index + t.length;
  }
  if (last < line.length) tokens.push({ cls: null, text: line.slice(last) });
  return tokens;
}

function yamlLine(line: string): CodeToken[] {
  const comment = line.indexOf('#');
  const body = comment >= 0 ? line.slice(0, comment) : line;
  const tokens: CodeToken[] = [];
  const key = body.match(/^(\s*-?\s*)([A-Za-z_][\w-]*)(:)(.*)$/);
  if (key) {
    tokens.push({ cls: null, text: key[1] }, { cls: 'kw', text: key[2] }, { cls: 'pn', text: key[3] });
    const value = key[4];
    if (value.trim()) tokens.push({ cls: /^\s*["']/.test(value) ? 'str' : 'ty', text: value });
  } else if (body) {
    const item = body.match(/^(\s*-\s*)(.*)$/);
    if (item) tokens.push({ cls: 'pn', text: item[1] }, { cls: null, text: item[2] });
    else tokens.push({ cls: null, text: body });
  }
  if (comment >= 0) tokens.push({ cls: 'cm', text: line.slice(comment) });
  return tokens;
}
