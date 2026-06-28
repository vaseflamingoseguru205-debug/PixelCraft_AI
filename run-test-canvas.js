const { createCanvas, Image } = require('canvas');

const c1 = createCanvas(100, 100);
const ctx1 = c1.getContext('2d');
ctx1.fillStyle = 'red';
ctx1.fillRect(0,0,100,100);

let imgData = ctx1.getImageData(0,0,100,100);
let data = imgData.data;

const OFFSET = 1000;
const sessionId = 'PX-DCY-123456789';
const adminPayloadStr = "PXCADMIN|" + sessionId + "|END";
const adminBytes = Buffer.from(adminPayloadStr);
const adminBits = [];
for(let i=0; i<adminBytes.length; i++) for(let j=7; j>=0; j--) adminBits.push((adminBytes[i] >> j) & 1);

let adminBitPtr = 0;
for(let i=0; i<OFFSET; i++) {
    if(i >= data.length) break;
    if((i+1)%4===0) continue;
    if (adminBitPtr < adminBits.length) {
        data[i] = (data[i] & ~1) | adminBits[adminBitPtr];
        adminBitPtr++;
    }
}

ctx1.putImageData(imgData, 0, 0);

// Export to buffer (simulate download)
const buffer = c1.toBuffer('image/png');

// Load buffer (simulate upload)
const img = new Image();
img.onload = () => {
    const c2 = createCanvas(100, 100);
    const ctx2 = c2.getContext('2d');
    ctx2.drawImage(img, 0, 0);
    
    let data2 = ctx2.getImageData(0,0,100,100).data;
    
    const extractedBytes = [];
    let currentByte = 0; let bitCount = 0;
    for(let i=0; i<1000; i++) {
        if(i >= data2.length) break;
        if((i+1)%4===0) continue;
        const bit = data2[i] & 1;
        currentByte = (currentByte << 1) | bit;
        bitCount++;
        if(bitCount === 8){ extractedBytes.push(currentByte); currentByte = 0; bitCount = 0; }
    }
    
    const rawStr = Buffer.from(extractedBytes).toString();
    console.log("Raw Str:", rawStr);
    console.log("Found:", rawStr.indexOf("PXCADMIN|"));
};
img.onerror = (err) => console.error(err);
img.src = buffer;