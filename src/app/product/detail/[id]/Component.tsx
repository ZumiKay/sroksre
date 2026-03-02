/**
 * Product Detail Components
 *
 * This module serves as the main export point for all product detail page components.
 * Components have been refactored into separate modules for better maintainability.
 */

// Re-export all components
export { ShowPrice, ShowPriceWithOptions } from "./components/PriceDisplay";
export { OptionSection } from "./components/OptionSection";
export { ButtonForSimilarProd } from "./components/ButtonForSimilarProd";

// Export types for external use
export type { ErrorMessageType } from "./components/StockSelector";
