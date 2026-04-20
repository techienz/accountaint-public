/**
 * Substitute {{variable}} placeholders in a template string.
 * Unknown variables are left as-is so missing placeholders are visible.
 *
 * Kept in its own file (no DB / server-only imports) so client components
 * can import it too (e.g. the template preview in Settings).
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | number | null | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    if (value === undefined || value === null) return match;
    return String(value);
  });
}
