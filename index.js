const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const db = require("./db");

const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "supersecret",
  resave: false,
  saveUninitialized: true
}));

// Home redirect
app.get("/", (req, res) => {
  if (req.session.user) {
    res.redirect("/dashboard");
  } else {
    res.redirect("/login");
  }
});

// Login page
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (!user) return res.send("Invalid username or password");
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send("Invalid username or password");

    req.session.user = { id: user.id, username: user.username };
    res.redirect("/dashboard");
  });
});

// Register page
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashed], (err) => {
    if (err) return res.send("Username already exists!");
    res.redirect("/login");
  });
});

// Dashboard
app.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("dashboard", { user: req.session.user });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
