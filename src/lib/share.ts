import { shareText, type ShareInput } from '../../shared/share';
import { BRANDS, type BrandId } from '../brand';

/** Copies the spoiler-free result to the clipboard. Resolves to false if the browser refused. */
export async function copyResult(input: Omit<ShareInput, 'brand' | 'url'>): Promise<boolean> {
  const brand = BRANDS[(document.documentElement.dataset.brand as BrandId) ?? 'tomato']?.name ?? BRANDS.tomato.name;
  const text = shareText({ ...input, brand, url: location.origin });
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / insecure contexts: fall back to a hidden textarea.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
