import http from "http";

const endpoints = ["/login", "/cart", "/wishlist", "/purchases", "/cart/fair", "/api/books/lookup"];

async function checkEndpoint(path) {
  return new Promise((resolve) => {
    http.get({ host: "localhost", port: 3000, path }, (res) => {
      resolve({
        path,
        statusCode: res.statusCode,
        location: res.headers.location || null,
      });
    }).on("error", (err) => {
      resolve({ path, error: err.message });
    });
  });
}

async function run() {
  console.log("Checking production HTTP server endpoints:");
  for (const ep of endpoints) {
    const res = await checkEndpoint(ep);
    console.log(`${res.path} -> HTTP ${res.statusCode}${res.location ? ` (Redirect: ${res.location})` : ""}`);
  }
}

run();
