const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Example simple login route
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // ✅ Replace with real DB check
  if (username === "admin" && password === "password123") {
    return res.send("✅ Login successful! Redirecting to dashboard...");
  } else {
    return res.status(401).send("❌ Invalid username or password");
  }
});

// Discord OAuth (auth.js)
app.get("/auth/discord", (req, res) => {
  // Redirect user to Discord's OAuth2 URL
  const redirect = `https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=identify%20email`;
  res.redirect(redirect);
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
