const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

// PRNG and Hash for QIM Extraction
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
    return hash;
}

function mulberry32(a) {
    return function() {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function bytesToStr(bytes) {
    return Buffer.from(bytes).toString('utf-8');
}

// Image QIM Extraction
async function extractImageQIM(filePath) {
    console.log(`[+] Scanning Image: ${filePath}`);
    const img = await loadImage(filePath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imgData.data;

    const blockSize = 8;
    const blocksX = Math.floor(img.width / blockSize);
    const blocksY = Math.floor(img.height / blockSize);
    const totalBlocks = blocksX * blocksY;
    const qStep = 32;
    const FIXED_REDUNDANCY = 25;

    const prng = mulberry32(hashString("PIXELCRAFT_ADMIN"));
    let blockIndices = new Uint32Array(totalBlocks);
    for(let i=0; i<totalBlocks; i++) blockIndices[i] = i;
    for(let i = totalBlocks - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        const temp = blockIndices[i]; blockIndices[i] = blockIndices[j]; blockIndices[j] = temp;
    }

    function extractBit(blockIndex) {
        const bx = blockIndex % blocksX;
        const by = Math.floor(blockIndex / blocksX);
        const startX = bx * blockSize;
        const startY = by * blockSize;
        let sum = 0, count = 0;
        for(let y = startY; y < startY + blockSize; y++) {
            for(let x = startX; x < startX + blockSize; x++) {
                sum += data[(y * img.width + x) * 4 + 2]; // Blue channel
                count++;
            }
        }
        const avg = sum / count;
        const v0 = Math.round(avg / qStep) * qStep;
        const v1 = Math.round((avg - qStep / 2) / qStep) * qStep + qStep / 2;
        return Math.abs(avg - v1) < Math.abs(avg - v0) ? 1 : 0;
    }

    let blockPtr = 0;
    let len16 = 0;
    for(let b=15; b>=0; b--) {
        let votes = 0;
        for(let r=0; r<FIXED_REDUNDANCY; r++) {
            if(blockPtr >= totalBlocks) return null;
            votes += extractBit(blockIndices[blockPtr++]) ? 1 : -1;
        }
        if(votes > 0) len16 |= (1 << b);
    }
    
    if(len16 <= 0 || len16 > 5000 || blockPtr + (len16 * 8 * FIXED_REDUNDANCY) > totalBlocks) return null;
    
    const payload = new Uint8Array(len16);
    for(let i=0; i<len16; i++) {
        let byteVal = 0;
        for(let b=7; b>=0; b--) {
            let votes = 0;
            for(let r=0; r<FIXED_REDUNDANCY; r++) {
                votes += extractBit(blockIndices[blockPtr++]) ? 1 : -1;
            }
            if(votes > 0) byteVal |= (1 << b);
        }
        payload[i] = byteVal;
    }

    const decText = bytesToStr(payload);
    if(decText && decText.startsWith("PXCADMIN|")) {
        const parts = decText.split("|");
        const sessionId = parts[1];
        console.log('\n=======================================');
        console.log(`[CRITICAL MATCH] IMAGE FORENSIC ID FOUND: ${sessionId}`);
        console.log('=======================================\n');
        return true;
    }
    console.log('[-] No QIM Image Forensic ID found.');
    return false;
}

// Audio QIM Extraction (Basic WAV Float32 Extractor)
function extractAudioQIM(filePath) {
    console.log(`[+] Scanning Audio: ${filePath}`);
    try {
        const { WaveFile } = require('wavefile');
        const buffer = fs.readFileSync(filePath);
        const wav = new WaveFile(buffer);
        wav.toSampleRate(44100);
        wav.toBitDepth('32f');
        const channelData = wav.getSamples(true, Float32Array)[0]; // Left channel

        const prng = mulberry32(hashString("PIXELCRAFT_ADMIN_KEY"));
        const Q_STEP = 0.008;
        const REDUNDANCY = 5;

        let indices = new Uint32Array(channelData.length);
        for(let i=0; i<channelData.length; i++) indices[i] = i;
        for(let i = channelData.length - 1; i > 0; i--) {
            const j = Math.floor(prng() * (i + 1));
            const temp = indices[i]; indices[i] = indices[j]; indices[j] = temp;
        }

        const extractBit = (idx) => {
            const val = channelData[idx];
            const v0 = Math.round(val/Q_STEP)*Q_STEP;
            const v1 = Math.round((val-Q_STEP/2)/Q_STEP)*Q_STEP + Q_STEP/2;
            return Math.abs(val-v1) < Math.abs(val-v0) ? 1 : 0;
        };

        let ptr = 0;
        let len16 = 0;
        for(let b=15; b>=0; b--) {
            let votes = 0;
            for(let r=0; r<REDUNDANCY; r++) {
                if (ptr >= channelData.length) return false;
                votes += extractBit(indices[ptr++]) ? 1 : -1;
            }
            if(votes > 0) len16 |= (1 << b);
        }

        if (len16 <= 0 || len16 > 10000 || ptr + (len16 * 8 * REDUNDANCY) > channelData.length) return false;

        const extractedBytes = [];
        for(let i=0; i<len16; i++) {
            let currentByte = 0;
            for(let b=7; b>=0; b--) {
                let votes = 0;
                for(let r=0; r<REDUNDANCY; r++) {
                    votes += extractBit(indices[ptr++]) ? 1 : -1;
                }
                if(votes > 0) currentByte |= (1 << b);
            }
            extractedBytes.push(currentByte);
        }

        const decText = bytesToStr(extractedBytes);
        if(decText && decText.startsWith("PXCADMIN|")) {
            const parts = decText.split("|");
            const sessionId = parts[1];
            console.log('\n=======================================');
            console.log(`[CRITICAL MATCH] AUDIO FORENSIC ID FOUND: ${sessionId}`);
            console.log('=======================================\n');
            return true;
        }
    } catch(e) {
        console.log(`[-] Failed to process audio: ${e.message}`);
    }
    console.log('[-] No QIM Audio Forensic ID found.');
    return false;
}

async function main() {
    const file = process.argv[2];
    if (!file) {
        console.log("Usage: node osint-scanner.js <path_to_image_or_audio>");
        process.exit(1);
    }
    if (file.toLowerCase().endsWith('.wav') || file.toLowerCase().endsWith('.mp3')) {
        extractAudioQIM(file);
    } else {
        await extractImageQIM(file);
    }
}

main();
