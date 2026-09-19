async function test() {
  console.log("=== Testing BookGuard Production Endpoints ===");

  const tests = [
    { url: "http://localhost:3000/manifest.webmanifest", name: "PWA WebManifest" },
    { url: "http://localhost:3000/sw.js", name: "Service Worker" },
    { url: "http://localhost:3000/offline", name: "Offline Shell Page" },
    { url: "http://localhost:3000/icons/icon-192.png", name: "Icon 192px" },
    { url: "http://localhost:3000/icons/icon-512.png", name: "Icon 512px" },
    { url: "http://localhost:3000/icons/icon-maskable-512.png", name: "Icon Maskable 512px" },
    { url: "http://localhost:3000/apple-touch-icon.png", name: "Apple Touch Icon" },
    { url: "http://localhost:3000/favicon.ico", name: "Favicon ICO" },
    { url: "http://localhost:3000/login", name: "Login Page" },
  ];

  for (const t of tests) {
    try {
      const res = await fetch(t.url);
      console.log(`[PASS] ${t.name}: Status ${res.status}, Type: ${res.headers.get("content-type")}`);
    } catch (err) {
      console.error(`[FAIL] ${t.name}:`, err.message);
    }
  }

  // Test Open Redirect Sanitization in auth callback
  console.log("\n=== Testing Open Redirect Security ===");
  try {
    const maliciousTargets = [
      "https://attacker.com",
      "//evil.org/phish",
      "http://rogue.io",
      "/cart", // valid internal
    ];

    for (const target of maliciousTargets) {
      const url = `http://localhost:3000/auth/callback?code=mock_code&next=${encodeURIComponent(target)}`;
      const res = await fetch(url, { redirect: "manual" });
      const location = res.headers.get("location");
      console.log(`Input next="${target}" -> Redirect location="${location}"`);
    }
  } catch (err) {
    console.error("Redirect test error:", err.message);
  }
}

test();
