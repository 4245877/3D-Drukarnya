// Retired catalog sections stay reachable from bookmarks and search results.
// Split sections lead to the catalog hub so neither part becomes hard to find.
// These routes are redirects only, excluded from navigation and the sitemap.
export const CATEGORY_REDIRECTS = {
  '/catalog/nas-cases/': '/catalog/cases-and-storage/',
  '/catalog/hdd-modules/': '/catalog/cases-and-storage/',
  '/catalog/network-rack-mounts/': '/catalog/equipment-mounts/',
  '/catalog/mini-pc-rack-mounts/': '/catalog/equipment-mounts/',
  '/catalog/raspberry-pi-rack/': '/catalog/equipment-mounts/',
  '/catalog/rack-shelves-and-panels/': '/catalog/rack-accessories/',
  '/catalog/rack-power-and-workshop/': '/catalog/',
  '/catalog/custom-rack-parts/': '/catalog/',
};
