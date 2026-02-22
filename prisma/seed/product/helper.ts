/**
 * Generate placeholder SVG images for product covers
 * @param count - Number of placeholder SVGs to generate
 * @returns Array of SVG data URLs
 */
export const generatePlaceholderSVGs = (count: number): string[] => {
  const svgs: string[] = [];
  const colors = [
    { bg: "#E3F2FD", text: "#1976D2" }, // Blue
    { bg: "#F3E5F5", text: "#7B1FA2" }, // Purple
    { bg: "#E8F5E9", text: "#388E3C" }, // Green
    { bg: "#FFF3E0", text: "#F57C00" }, // Orange
    { bg: "#FCE4EC", text: "#C2185B" }, // Pink
    { bg: "#E0F2F1", text: "#00796B" }, // Teal
    { bg: "#FFF9C4", text: "#F9A825" }, // Yellow
    { bg: "#FFEBEE", text: "#D32F2F" }, // Red
    { bg: "#F5F5F5", text: "#616161" }, // Gray
    { bg: "#EDE7F6", text: "#512DA8" }, // Deep Purple
  ];

  for (let i = 0; i < count; i++) {
    const color = colors[i % colors.length];
    const imageNumber = i + 1;

    const svg = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="600" fill="${color.bg}"/>
        <circle cx="400" cy="250" r="80" fill="${color.text}" opacity="0.2"/>
        <text x="400" y="280" font-family="Arial, sans-serif" font-size="48" 
              fill="${color.text}" text-anchor="middle" font-weight="bold">
          Product ${imageNumber}
        </text>
        <text x="400" y="340" font-family="Arial, sans-serif" font-size="24" 
              fill="${color.text}" text-anchor="middle" opacity="0.7">
          Placeholder Image
        </text>
        <rect x="300" y="380" width="200" height="120" rx="10" 
              fill="none" stroke="${color.text}" stroke-width="3" opacity="0.3"/>
        <line x1="350" y1="410" x2="450" y2="470" stroke="${color.text}" 
              stroke-width="3" opacity="0.3" stroke-linecap="round"/>
        <line x1="450" y1="410" x2="350" y2="470" stroke="${color.text}" 
              stroke-width="3" opacity="0.3" stroke-linecap="round"/>
      </svg>
    `.trim();

    // Convert to base64 data URL
    const base64 = Buffer.from(svg).toString("base64");
    const dataUrl = `data:image/svg+xml;base64,${base64}`;

    svgs.push(dataUrl);
  }

  return svgs;
};

/**
 * Generate simple colored placeholder SVGs
 * @param count - Number of placeholder SVGs to generate
 * @returns Array of SVG data URLs
 */
export const generateSimplePlaceholderSVGs = (count: number): string[] => {
  const svgs: string[] = [];
  const gradients = [
    ["#667eea", "#764ba2"], // Purple gradient
    ["#f093fb", "#f5576c"], // Pink gradient
    ["#4facfe", "#00f2fe"], // Blue gradient
    ["#43e97b", "#38f9d7"], // Green gradient
    ["#fa709a", "#fee140"], // Sunset gradient
    ["#30cfd0", "#330867"], // Ocean gradient
    ["#a8edea", "#fed6e3"], // Pastel gradient
    ["#ff9a56", "#ff6a88"], // Orange gradient
    ["#96fbc4", "#f9f586"], // Fresh gradient
    ["#ffecd2", "#fcb69f"], // Peach gradient
  ];

  for (let i = 0; i < count; i++) {
    const [color1, color2] = gradients[i % gradients.length];
    const imageNumber = i + 1;

    const svg = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#grad${i})"/>
        <text x="400" y="320" font-family="Arial, sans-serif" font-size="120" 
              fill="white" text-anchor="middle" font-weight="bold" opacity="0.9">
          ${imageNumber}
        </text>
      </svg>
    `.trim();

    const base64 = Buffer.from(svg).toString("base64");
    const dataUrl = `data:image/svg+xml;base64,${base64}`;

    svgs.push(dataUrl);
  }

  return svgs;
};
