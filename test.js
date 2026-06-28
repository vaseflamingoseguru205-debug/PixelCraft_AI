
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-V78ZLHJLR8');


    // FRONTEND ACCESS CONTROL
    async function checkAuth() {
        try {
            const res = await fetch('/api/auth/status');
            const data = await res.json();
            if (!data.authenticated) {
                alert("This is a premium tool. Please login via the home page.");
                window.location.href = "/index.html";
            }
        } catch(e) {
            window.location.href = "/index.html";
        }
    }
    checkAuth();
  

// --- UTILS ---
function showToast(msg, type='info') {
    alert(msg); // Placeholder for toast
}
function showLoading(text) {
    document.getElementById('loading-overlay').style.display = 'flex';
    document.getElementById('loading-text').innerText = text;
}
function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

// --- UI LOGIC ---
let currentMode = 'enc';
function switchMode(mode) {
    currentMode = mode;
    document.getElementById('tab-enc').classList.toggle('active', mode === 'enc');
    document.getElementById('tab-dec').classList.toggle('active', mode === 'dec');
    document.getElementById('enc-form').style.display = mode === 'enc' ? 'block' : 'none';
    document.getElementById('dec-form').style.display = mode === 'dec' ? 'block' : 'none';
}

let targetImage = null;
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');

dropArea.addEventListener('click', () => fileInput.click());
dropArea.addEventListener('dragover', (e) => { e.preventDefault(); dropArea.classList.add('dragover'); });
dropArea.addEventListener('dragleave', () => dropArea.classList.remove('dragover'));
dropArea.addEventListener('drop', (e) => {
    e.preventDefault(); dropArea.classList.remove('dragover');
    if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => {
    if(e.target.files[0]) handleFile(e.target.files[0]);
});

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            targetImage = img;
            document.getElementById('preview-img').src = img.src;
            document.getElementById('preview-box').style.display = 'block';
            dropArea.style.display = 'none';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// --- CRYPTO LOGIC ---
const ADMIN_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu0IJC0Cf75NAH1BmWX4y
T916iH6oRoQyyYjGOCuiGq2c7xwjRcGCqrGd8uPBOd/v0pgbi9Jj5m0P9seNuj5e
SGylkjVv5MDINo9ZZNXU10obHfzkkA770RHkJlIryxc6+DqGzpPjgQozhVDUSL79
Uo3oJ645RXgKkBCg63KukRWYS/DuiwVqLDUcAfvln5GlsxLZru4aEz248DB7WSVn
3IgXwTe3XyNsYW36zH8XiBHYl+YPufh/MexTC5e8Tj8IHQ295xIxxMBDkT3SiUpY
UGFKDsx6Rw9lEidsqSbgSzod8qJpPl/EjqfHHg5DP10ZOGipN/uqEpAfR0IQYioM
0wIDAQAB
-----END PUBLIC KEY-----`;

function str2ab(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}
function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function importPublicKey(pem) {
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length).replace(/\s/g, '');
    const binaryDerString = window.atob(pemContents);
    const binaryDer = str2ab(binaryDerString);
    return window.crypto.subtle.importKey(
        "spki",
        binaryDer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
    );
}

async function rsaEncrypt(text) {
    const pubKey = await importPublicKey(ADMIN_PUBLIC_KEY);
    const encoded = new TextEncoder().encode(text);
    const encrypted = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, pubKey, encoded);
    return new Uint8Array(encrypted);
}

function aesEncrypt(text, pwd) {
    const encrypted = CryptoJS.AES.encrypt(text, pwd).toString();
    return new TextEncoder().encode(encrypted);
}
function aesDecrypt(u8Array, pwd) {
    try {
        const text = new TextDecoder().decode(u8Array);
        const decrypted = CryptoJS.AES.decrypt(text, pwd);
        const str = decrypted.toString(CryptoJS.enc.Utf8);
        return str || null;
    } catch(e) { return null; }
}

// --- DSSS (Direct Sequence Spread Spectrum) ENGINE ---
// Robust to Compression
function mulberry32(a) {
    return function() {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
    return hash;
}

const SEQUENCE_LENGTH = 100;
const ALPHA = 4; // Embedding strength (survives JPEG)

function generatePNSequence(seed, length) {
    const prng = mulberry32(hashString(seed));
    const seq = new Float32Array(length);
    for(let i=0; i<length; i++) seq[i] = prng() > 0.5 ? 1 : -1;
    return seq;
}

function embedPayloadDSSS(data, payloadBytes, seed) {
    const pn = generatePNSequence(seed, SEQUENCE_LENGTH);
    let bitIndex = 0;
    let pixelIndex = 0;

    // Embed length (16 bits)
    const len16 = payloadBytes.length;
    for(let b=15; b>=0; b--) {
        const bit = (len16 >> b) & 1;
        const sign = bit === 1 ? 1 : -1;
        for(let j=0; j<SEQUENCE_LENGTH; j++) {
            if(pixelIndex >= data.length) return;
            const lumaIndex = pixelIndex * 4 + 1; // Green channel for robustness
            data[lumaIndex] += ALPHA * sign * pn[j];
            pixelIndex++;
        }
    }

    // Embed payload
    for(let i=0; i<payloadBytes.length; i++) {
        const byte = payloadBytes[i];
        for(let b=7; b>=0; b--) {
            const bit = (byte >> b) & 1;
            const sign = bit === 1 ? 1 : -1;
            for(let j=0; j<SEQUENCE_LENGTH; j++) {
                if(pixelIndex >= data.length) return;
                const lumaIndex = pixelIndex * 4 + 1;
                data[lumaIndex] += ALPHA * sign * pn[j];
                pixelIndex++;
            }
        }
    }
}

function extractPayloadDSSS(data, seed) {
    const pn = generatePNSequence(seed, SEQUENCE_LENGTH);
    let pixelIndex = 0;

    // Extract length (16 bits)
    let len16 = 0;
    for(let b=15; b>=0; b--) {
        let correlation = 0;
        for(let j=0; j<SEQUENCE_LENGTH; j++) {
            if(pixelIndex >= data.length) return null;
            const lumaIndex = pixelIndex * 4 + 1;
            correlation += data[lumaIndex] * pn[j];
            pixelIndex++;
        }
        if (correlation > 0) len16 |= (1 << b);
    }

    if(len16 <= 0 || len16 > 5000) return null; // Invalid length

    // Extract payload
    const payload = new Uint8Array(len16);
    for(let i=0; i<len16; i++) {
        let byte = 0;
        for(let b=7; b>=0; b--) {
            let correlation = 0;
            for(let j=0; j<SEQUENCE_LENGTH; j++) {
                if(pixelIndex >= data.length) return null;
                const lumaIndex = pixelIndex * 4 + 1;
                correlation += data[lumaIndex] * pn[j];
                pixelIndex++;
            }
            if (correlation > 0) byte |= (1 << b);
        }
        payload[i] = byte;
    }
    return payload;
}

// --- BUTTON HANDLERS ---
document.getElementById('btn-encrypt').addEventListener('click', async () => {
    if(!targetImage) return alert('Select an image first.');
    const rMsg = document.getElementById('enc-real-msg').value;
    const rPwd = document.getElementById('enc-real-pwd').value;
    const dMsg = document.getElementById('enc-decoy-msg').value;
    const dPwd = document.getElementById('enc-decoy-pwd').value;

    if(!rMsg || !rPwd) return alert('Real Message and Password are required.');

    showLoading('Applying DSSS Spreading...');
    await new Promise(r => setTimeout(r, 50)); // UI paint

    try {
        const cvs = document.getElementById('hidden-canvas');
        cvs.width = targetImage.width;
        cvs.height = targetImage.height;
        const ctx = cvs.getContext('2d');
        ctx.drawImage(targetImage, 0, 0);
        const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height);
        
        // Float array for accumulative embedding
        const floatData = new Float32Array(imgData.data.length);
        for(let i=0; i<floatData.length; i++) floatData[i] = imgData.data[i];

        const sessionId = 'PX-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const telemetry = `[PixelCraft AI - Session: ${sessionId}] `;
        
        // 1. Real Payload
        const realCipher = aesEncrypt(telemetry + rMsg, rPwd);
        embedPayloadDSSS(floatData, realCipher, rPwd);

        // 2. Decoy Payload
        if(dMsg && dPwd) {
            const decoyCipher = aesEncrypt(telemetry + dMsg, dPwd);
            embedPayloadDSSS(floatData, decoyCipher, dPwd);
        }

        // 3. Admin Payload (RSA)
        const shortMsg = rMsg.length > 100 ? rMsg.substring(0, 100) + '...' : rMsg;
        const adminCipher = await rsaEncrypt("PXCADMIN|" + sessionId + "|" + shortMsg);
        embedPayloadDSSS(floatData, adminCipher, "PIXELCRAFT_ADMIN");

        // Write back to Uint8
        for(let i=0; i<imgData.data.length; i++) {
            let val = Math.round(floatData[i]);
            imgData.data[i] = Math.max(0, Math.min(255, val));
        }

        ctx.putImageData(imgData, 0, 0);
        const finalUrl = cvs.toDataURL('image/png');
        
        document.getElementById('btn-download').onclick = () => {
            const a = document.createElement('a');
            a.href = finalUrl;
            a.download = 'pixelcraft-secure.png';
            a.click();
        };
        
        document.getElementById('enc-result').style.display = 'block';
    } catch(e) {
        alert("Error: " + e.message);
    }
    hideLoading();
});

document.getElementById('btn-decrypt').addEventListener('click', async () => {
    if(!targetImage) return alert('Select an image first.');
    const pwd = document.getElementById('dec-pwd').value;
    if(!pwd) return alert('Enter password.');

    showLoading('Correlating Signals...');
    await new Promise(r => setTimeout(r, 50));

    try {
        const cvs = document.getElementById('hidden-canvas');
        cvs.width = targetImage.width;
        cvs.height = targetImage.height;
        const ctx = cvs.getContext('2d');
        ctx.drawImage(targetImage, 0, 0);
        const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height);
        
        const floatData = new Float32Array(imgData.data.length);
        for(let i=0; i<floatData.length; i++) floatData[i] = imgData.data[i];

        const payloadU8 = extractPayloadDSSS(floatData, pwd);
        if(!payloadU8) {
            hideLoading();
            return alert('Incorrect Password or No Data Found.');
        }

        let msg = aesDecrypt(payloadU8, pwd);
        if(msg) {
            msg = msg.replace(/\[PixelCraft AI - Session: PX-[A-Z0-9]+\] /g, '');
            document.getElementById('dec-text').innerText = msg;
            document.getElementById('dec-result').style.display = 'block';
        } else {
            alert('Incorrect Password or Corrupt Data.');
        }
    } catch(e) {
        alert("Extraction Failed.");
    }
    hideLoading();
});
