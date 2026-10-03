const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function getKey(secret: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptPayload(value: unknown, secret: string) {
  const key = await getKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(JSON.stringify(value)));
  return toBase64Url(iv) + "." + toBase64Url(new Uint8Array(encrypted));
}

export async function decryptPayload<T>(value: string, secret: string) {
  const [ivValue, encryptedValue] = value.split(".");
  const key = await getKey(secret);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64Url(ivValue) }, key, fromBase64Url(encryptedValue));
  return JSON.parse(decoder.decode(decrypted)) as T;
}

export async function hashToken(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return toBase64Url(new Uint8Array(digest));
}

export function randomToken() {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}
