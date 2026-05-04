const VITE_API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

// Simple validation
if (!VITE_API_URL.startsWith("http")) {
  console.warn("⚠️ VITE_API_URL might be invalid:", VITE_API_URL);
}

export const env = {
  VITE_API_URL,
};
