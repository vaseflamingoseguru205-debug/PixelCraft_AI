// Improved logo with much larger, more visible text
const b64 = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="300">🎨</text><text x="50%" y="88%" text-anchor="middle" fill="#000000" stroke="#ffffff" stroke-width="8" stroke-linejoin="round" font-size="100" font-family="Arial, sans-serif" font-weight="900" letter-spacing="2">PixelCraft AI</text></svg>').toString('base64');
console.log('data:image/svg+xml;base64,' + b64);
