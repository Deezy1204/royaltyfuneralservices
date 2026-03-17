const fs = require('fs');

async function test() {
  try {
    const result = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: "admin@royaltyfuneral.co.za", password: "admin123" })
    });
    const text = await result.text();
    fs.writeFileSync("output.json", JSON.stringify({
      status: result.status,
      body: text.substring(0, 200)
    }));
  } catch (err) {
    fs.writeFileSync("output.json", JSON.stringify({ error: err.message }));
  }
}
test();
