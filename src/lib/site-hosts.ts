/** The two public origins served during the VIIX domain transition. */
const productionHostnames = new Set([
  "tncod-professionals-azure.vercel.app",
  "codprofessionals.viix.solutions",
]);

export function isProductionSiteHostname(hostname: string): boolean {
  return productionHostnames.has(hostname.toLowerCase());
}
