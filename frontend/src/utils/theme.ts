export function applySchoolTheme(primaryColor?: string | null, accentColor?: string | null): void {
  const root = document.documentElement;
  const primary = primaryColor && /^#[0-9A-Fa-f]{6}$/.test(primaryColor) ? primaryColor : '#0F294A';
  const accent = accentColor && /^#[0-9A-Fa-f]{6}$/.test(accentColor) ? accentColor : '#D97706';

  root.style.setProperty('--brand-primary', primary);
  root.style.setProperty('--brand-accent', accent);
  root.style.setProperty('--brand-primary-dark', shadeHexColor(primary, -22));
  root.style.setProperty('--brand-primary-soft', `${primary}18`);
  root.style.setProperty('--brand-accent-hover', shadeHexColor(accent, -18));
  root.style.setProperty('--brand-accent-soft', `${accent}22`);
}

function shadeHexColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
