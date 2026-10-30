/** Public origins approved for the domain transition. */
const productionHostnames = new Set([
  "tncod-professionals-azure.vercel.app",
  "codprofessionals.viix.solutions",
  "codprofessionals.69resources.com",
]);

export function isProductionSiteHostname(hostname: string): boolean {
  return productionHostnames.has(hostname.toLowerCase());
}
