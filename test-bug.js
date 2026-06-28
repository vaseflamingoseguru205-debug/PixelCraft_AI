const OFFSET = 1000;
const sessionId = 'PX-DCY-' + Math.random().toString(36).substr(2, 9).toUpperCase();
const adminPayloadStr = "PXCADMIN|" + sessionId + "|END";

const TextEncoder = require('util').TextEncoder;
const TextDecoder = require('util').TextDecoder;

let adminBytes = new TextEncoder().encode(adminPayloadStr);
let adminBits = [];
for(let i=0; i<adminBytes.length; i++) for(let j=7; j>=0; j--) adminBits.push((adminBytes[i] >> j) & 1);

let data = new Uint8Array(2000);
for(let i=0; i<data.length; i++) data[i] = Math.floor(Math.random() * 256);

let adminBitPtr = 0;
for(let i=0; i<OFFSET; i++) {
    if(i >= data.length) break;
    if((i+1)%4===0) continue;
    if (adminBitPtr < adminBits.length) {
        data[i] = (data[i] & ~1) | adminBits[adminBitPtr];
        adminBitPtr++;
    }
}

// Now Decode!
const extractedBytes = [];
let currentByte = 0; let bitCount = 0;
for(let i=0; i<1000; i++) {
    if(i >= data.length) break;
    if((i+1)%4===0) continue;
    const bit = data[i] & 1;
    currentByte = (currentByte << 1) | bit;
    bitCount++;
    if(bitCount === 8){ extractedBytes.push(currentByte); currentByte = 0; bitCount = 0; }
}

const rawStr = new TextDecoder().decode(new Uint8Array(extractedBytes));
console.log("String Length:", rawStr.length);
console.log("Index Of PXCADMIN|:", rawStr.indexOf("PXCADMIN|"));
console.log("Index Of |END:", rawStr.indexOf("|END"));