const fetch = require('node-fetch'); // Next.js polyfills global fetch in recent Node versions, but let's just use global fetch since Node 18+ has it.

async function testPOST() {
  const url = "http://localhost:3000/api/auth/login";
  const body = JSON.stringify({ email: "admin@royaltyfuneral.co.za", password: "admin123" });
  console.log(`Sending POST to ${url}`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response text length: ${text.length}`);
    console.log(`Response text (preview): ${text.substring(0, 100)}`);
  } catch (err) {
    console.error("Error:", err);
  }
}

testPOST();
