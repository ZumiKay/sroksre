/**
 * Example usage of placeholder SVG generators
 */

import {
  generatePlaceholderSVGs,
  generateSimplePlaceholderSVGs,
} from "./index";

// Example 1: Generate 5 detailed placeholder SVGs
console.log("=== Generating 5 detailed placeholders ===");
const detailedSVGs = generatePlaceholderSVGs(5);
detailedSVGs.forEach((svg, index) => {
  console.log(`Placeholder ${index + 1}: ${svg.substring(0, 50)}...`);
});

// Example 2: Generate 10 simple gradient placeholders
console.log("\n=== Generating 10 simple gradient placeholders ===");
const simpleSVGs = generateSimplePlaceholderSVGs(10);
simpleSVGs.forEach((svg, index) => {
  console.log(`Simple Placeholder ${index + 1}: ${svg.substring(0, 50)}...`);
});

// Example 3: Save to use with Prisma seed
console.log("\n=== Example Prisma usage ===");
const productCovers = generatePlaceholderSVGs(3);
console.log(`Generated ${productCovers.length} product cover placeholders`);

// You can use these data URLs directly in your seed data:
const exampleProductData = {
  name: "Example Product",
  covers: productCovers, // Array of SVG data URLs
};

console.log("\nProduct data structure:");
console.log(JSON.stringify(exampleProductData, null, 2).substring(0, 200));
