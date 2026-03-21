// Circle SVG logo
const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><circle cx="200" cy="200" r="195" fill="#ffffff" /><text x="50%" y="42%" dominant-baseline="middle" text-anchor="middle" font-size="180">🎨</text><text x="50%" y="82%" text-anchor="middle" fill="#0f172a" font-size="56" font-family="Arial, sans-serif" font-weight="900" letter-spacing="1">PixelCraft AI</text></svg>`;

const b64 = Buffer.from(rawSvg).toString('base64');
console.log('data:image/svg+xml;base64,' + b64);
