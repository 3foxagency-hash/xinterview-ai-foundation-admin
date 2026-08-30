/**
 * Turns a stored template string (plain text or simple HTML, with raw
 * `{{ token }}` markers) into editor HTML where every placeholder is an
 * atomic, non-editable chip — and back again.
 *
 * Why: a placeholder used to be just literal characters sitting in the
 * text, so a stray backspace could delete one brace and silently break the
 * token (`{ candidate_name }}` never matches the send-time replacement
 * regex). Rendering it as a single `contenteditable="false"` chip makes it
 * one unit to the browser: the cursor steps over it, and deleting it removes
 * the whole placeholder in one go — there is no way to leave half of it
 * behind. The stored value is unchanged either way, so nothing downstream
 * (the send-time replace, the backend payload) has to know this exists.
 */

const TOKEN_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

const CHIP_CLASS =
  'ph-chip rounded border border-primary/30 bg-active-menu-bg px-1 py-px font-mono text-[0.85em] text-primary';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function chipHtml(token: string): string {
  // The token carries its own display text (`{{ candidate_name }}`) via
  // data-token so serialisation can read it straight back out — the chip
  // never depends on child text nodes staying intact.
  return `<span class="${CHIP_CLASS}" contenteditable="false" data-token="${escapeHtml(token)}">${escapeHtml(token)}</span>`;
}

/**
 * Plain/HTML value -> editor HTML with placeholders as chips.
 *
 * `mode: 'plain'` additionally escapes the surrounding text and turns `\n`
 * into `<br>` — SMS bodies are raw text, not the `<p>`-wrapped HTML the
 * email body already is, so they need that extra step to render safely as
 * `contentEditable` markup.
 */
export function toEditorHtml(value: string, mode: 'html' | 'plain' = 'html'): string {
  if (mode === 'html') {
    return value.replace(TOKEN_RE, (match) => chipHtml(match));
  }
  const parts = value.split(TOKEN_RE);
  // String.split with a capturing group interleaves the captured group
  // (the token name, without braces) between the surrounding text pieces.
  return parts
    .map((part, i) =>
      i % 2 === 1 ? chipHtml(`{{ ${part} }}`) : escapeHtml(part).replace(/\n/g, '<br>')
    )
    .join('');
}

/** Editor HTML (chips and all) -> the plain stored string. */
export function fromEditorHtml(container: HTMLElement): string {
  let out = '';
  const walk = (node: ChildNode) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? '';
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    if (el.dataset.token) {
      out += el.dataset.token;
      return;
    }
    if (el.tagName === 'BR') {
      out += '\n';
      return;
    }
    const isBlock = ['P', 'DIV', 'LI'].includes(el.tagName);
    el.childNodes.forEach(walk);
    if (isBlock) out += '\n';
  };
  container.childNodes.forEach(walk);
  return out.replace(/\n+$/, '');
}

/** The `{{ token }}` string to insert for a placeholder button, as chip HTML. */
export function placeholderChipHtml(token: string): string {
  return chipHtml(token);
}
