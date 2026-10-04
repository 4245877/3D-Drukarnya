// PUBLIC makes the non-sensitive preview switch visible to Astro's env loader.
// Production builds ignore it, even if inherited from a preview shell.
export const isDraftPreview = import.meta.env.DEV &&
  import.meta.env.PUBLIC_CATALOG_PREVIEW_DRAFTS === '1';
