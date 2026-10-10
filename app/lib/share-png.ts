import { Buffer } from "node:buffer";
import { inflateSync } from "node:zlib";

export const maxShareImageBytes = 1024 * 1024;

export function validSharePng(bytes: Uint8Array) {
  if (bytes.length < 57 || bytes.length > maxShareImageBytes || !Buffer.from(bytes.subarray(0, 8)).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(8) !== 13 || Buffer.from(bytes.subarray(12, 16)).toString() !== "IHDR" || view.getUint32(16) !== 1200 || view.getUint32(20) !== 630 || bytes[24] !== 8 || ![2, 6].includes(bytes[25]) || bytes[26] !== 0 || bytes[27] !== 0 || bytes[28] !== 0) return false;
  const chunks: Uint8Array[] = [];
  let ended = false;
  for (let offset = 8; offset < bytes.length;) {
    if (offset + 12 > bytes.length) return false;
    const length = view.getUint32(offset), end = offset + 12 + length;
    if (end > bytes.length) return false;
    const type = Buffer.from(bytes.subarray(offset + 4, offset + 8)).toString();
    let crc = 0xffffffff;
    for (let i = offset + 4; i < end - 4; i++) {
      crc ^= bytes[i];
      for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    if (((crc ^ 0xffffffff) >>> 0) !== view.getUint32(end - 4)) return false;
    if (type === "IDAT") chunks.push(bytes.subarray(offset + 8, end - 4));
    if (type === "IEND") { if (length !== 0 || end !== bytes.length) return false; ended = true; }
    offset = end;
  }
  if (!ended || !chunks.length) return false;
  const rowBytes = 1200 * (bytes[25] === 6 ? 4 : 3) + 1;
  try {
    const raw = inflateSync(Buffer.concat(chunks), { maxOutputLength: rowBytes * 630 });
    if (raw.length !== rowBytes * 630) return false;
    for (let row = 0; row < 630; row++) if (raw[row * rowBytes] > 4) return false;
    return true;
  } catch { return false; }
}
