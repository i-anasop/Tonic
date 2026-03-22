const http = require("http");
const url = require("url");

const manifest = {
  url: "http://192.168.0.100:8083",
  name: "Tonic - Task Management",
  description: "Manage your tasks with AI insights powered by TON blockchain",
  verificationUrl: "https://ton.app/manifest/geturl",
  iconUrl: "https://via.placeholder.com/192x192?text=Tonic",
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  if (pathname === "/tonconnect-manifest.json") {
    res.writeHead(200);
    res.end(JSON.stringify(manifest, null, 2));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
  }
});

server.listen(5555, () => {
  console.log("✅ Manifest server running on http://localhost:5555");
  console.log("📄 Manifest available at http://localhost:5555/tonconnect-manifest.json");
  console.log("\n📝 Make sure to run this before starting the Expo app:");
  console.log("   npm run manifest:serve");
});

