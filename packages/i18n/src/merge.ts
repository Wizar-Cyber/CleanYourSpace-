export function mergeResources(
  commonEn: Record<string, unknown>,
  appEn: Record<string, unknown>,
  commonEs: Record<string, unknown>,
  appEs: Record<string, unknown>,
): { en: { translation: Record<string, unknown> }; es: { translation: Record<string, unknown> } } {
  return {
    en: { translation: { ...commonEn, ...appEn } },
    es: { translation: { ...commonEs, ...appEs } },
  };
}
