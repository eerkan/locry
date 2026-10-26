/**
 * Copies text to the clipboard. Where the browser refuses (permissions, embedded views), the
 * given element's text is selected instead so it can be copied by hand. Returns whether it copied.
 */
export async function copyText(text: string, fallback?: Element | null): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (fallback) {
      const range = document.createRange();
      range.selectNodeContents(fallback);
      const selection = getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    return false;
  }
}
