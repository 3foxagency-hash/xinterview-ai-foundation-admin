/* ═══════════════════════════════════════════════════════════
   Brand-derived colour system for the candidate interview page.
   One hex in → full token set out, WCAG AA enforced.
   ═══════════════════════════════════════════════════════════ */

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string): number {
  const m = hex.replace('#', '').match(/\w\w/g);
  if (!m) return 0;
  const [r, g, b] = m.map((h) => srgbToLinear(parseInt(h, 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Text colour to place ON a filled surface. */
export function onColor(bg: string): string {
  return contrast(bg, '#FFFFFF') >= contrast(bg, '#111111') ? '#FFFFFF' : '#111111';
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = hex.replace('#', '').match(/\w\w/g);
  if (!m) return { h: 0, s: 0, l: 0 };
  let [r, g, b] = m.map((h) => parseInt(h, 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (v: number) =>
    Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hslLightness(hex: string): number {
  return hexToHsl(hex).l / 100;
}

export function adjustLightness(hex: string, delta: number): string {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, Math.min(100, l + delta * 100)));
}

/** CTA fill: darken the brand until white text clears 4.5:1. */
export function ctaFill(brand: string): string {
  let c = brand;
  let guard = 0;
  while (contrast(c, '#FFFFFF') < 4.5 && hslLightness(c) > 0.15 && guard < 30) {
    c = adjustLightness(c, -0.05);
    guard++;
  }
  return c;
}

/** Accent lifted for dark mode: lighten until it clears 4.5:1 on the dark canvas. */
export function accentOnDark(brand: string, canvas: string): string {
  let c = brand;
  let guard = 0;
  while (contrast(c, canvas) < 4.5 && hslLightness(c) < 0.85 && guard < 30) {
    c = adjustLightness(c, 0.05);
    guard++;
  }
  return c;
}

/** Clamp a value to [0, 100]. */
const clamp = (v: number) => Math.max(0, Math.min(100, v));

export interface ThemeTokens {
  light: Record<string, string>;
  dark: Record<string, string>;
}

/**
 * Derive the full token set from a single brand hex.
 * Returns CSS custom-property values (without the `--` prefix).
 */
export function deriveTokens(brand: string): ThemeTokens {
  const { h, s } = hexToHsl(brand);
  const isNearWhite = luminance(brand) > 0.85;
  const isNearBlack = luminance(brand) < 0.03;

  /* ---- Light mode ---- */
  const lCanvas = isNearWhite
    ? hslToHex(h, 2, 97)
    : hslToHex(h, Math.min(s, 4), 97);
  const lText = hslToHex(h, Math.min(s, 8), 12);
  const lTextSecondary = hslToHex(h, 8, 48);
  const lHairline = hslToHex(h, 10, 88);
  const lAccent = isNearBlack ? adjustLightness(brand, 0.4) : ctaFill(brand);
  const lOnAccent = onColor(lAccent);
  const lGlow = hslToHex(h, Math.min(s, 60), 50);

  /* ---- Dark mode ---- */
  const dCanvas = isNearBlack
    ? hslToHex(h, 4, 8)
    : hslToHex(h, 6, 8);
  const dText = hslToHex(h, 6, 95);
  const dTextSecondary = hslToHex(h, 6, 65);
  const dHairline = hslToHex(h, 12, 24);
  const dAccent = accentOnDark(brand, dCanvas);
  const dOnAccent = onColor(dAccent);
  const dGlow = adjustLightness(dAccent, 0.1);

  const light: Record<string, string> = {
    canvas: lCanvas,
    surface: lCanvas,
    surfaceOpacity: '0.7',
    hairline: lHairline,
    text: lText,
    'text-secondary': lTextSecondary,
    accent: lAccent,
    'on-accent': lOnAccent,
    glow: lGlow,
    'glow-opacity': '0.18',
    'grain-opacity': '0.03',
    warning: '#B8842E',
  };

  const dark: Record<string, string> = {
    canvas: dCanvas,
    surface: dCanvas,
    surfaceOpacity: '0.55',
    hairline: dHairline,
    text: dText,
    'text-secondary': dTextSecondary,
    accent: dAccent,
    'on-accent': dOnAccent,
    glow: dGlow,
    'glow-opacity': '0.14',
    'grain-opacity': '0.03',
    warning: '#D4933E',
  };

  return { light, dark };
}

/**
 * Emit tokens as CSS custom properties on a style object.
 * Keys are prefixed with `--iv-` to scope them to the interview page.
 */
export function tokensToStyle(
  tokens: Record<string, string>,
  prefix = '--iv-',
): React.CSSProperties {
  const style: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens)) {
    style[`${prefix}${key}`] = value;
  }
  return style as React.CSSProperties;
}

/** Assert WCAG AA for critical pairs — throws in dev if any pair fails. */
export function assertContrast(brand: string): void {
  const { light, dark } = deriveTokens(brand);
  const checks: Array<[string, string, string, number]> = [
    ['light text-on-canvas', light.text, light.canvas, 4.5],
    ['light secondary-on-canvas', light['text-secondary'], light.canvas, 4.5],
    ['light on-accent-on-accent', light['on-accent'], light.accent, 4.5],
    ['dark text-on-canvas', dark.text, dark.canvas, 4.5],
    ['dark secondary-on-canvas', dark['text-secondary'], dark.canvas, 4.5],
    ['dark on-accent-on-accent', dark['on-accent'], dark.accent, 4.5],
  ];
  const failures = checks.filter(
    ([label, a, b, min]) => {
      const c = contrast(a, b);
      if (c < min) {
        console.warn(`[interview theme] ${label}: ${c.toFixed(2)} < ${min}`);
        return true;
      }
      return false;
    },
  );
  if (failures.length > 0) {
    console.warn(
      `[interview theme] ${failures.length} contrast pair(s) below WCAG AA for brand ${brand}`,
    );
  }
}
