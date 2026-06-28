const bytes = [];
const str = "PXCADMIN|PX-DCY-123456789|END";
for(let i=0; i<str.length; i++) bytes.push(str.charCodeAt(i));

// Add 64 random bytes
for(let i=0; i<64; i++) bytes.push(Math.floor(Math.random() * 256));

const u8 = new Uint8Array(bytes);
const rawStr = new TextDecoder().decode(u8);
console.log("Raw string:", rawStr);
console.log("Found:", rawStr.indexOf("PXCADMIN|"));
console.log("Found END:", rawStr.indexOf("|END"));