const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const db = require("./db");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const settings = require("./settings.json");

const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// ---------------- Session ----------------
app.use(session({
  secret: settings.sessionSecret || "supersecret",
  resave: false,
  saveUninitialized: true
}));

// ---------------- Passport ----------------
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.discord_id || user.id);
});

passport.deserializeUser((id, done) => {
  db.get("SELECT * FROM users WHERE discord_id = ? OR id = ?", [id, id], (err, row) => {
    if (err) return done(err);
    if (row) return done(null, row);
    return done(null, false);
  });
});

// ---------------- Discord Strategy ----------------
passport.use(new DiscordStrategy({
  clientID: settings.discordClientID,
  clientSecret: settings.discordClientSecret,
  callbackURL: "https://yourcustomdomain.com/discord/callback", // fixed URL
  scope: ["identify", "email"]
}, (accessToken, refreshToken, profile, done) => {
  db.get("SELECT * FROM users WHERE discord_id = ?", [profile.id], (err, row) => {
    if (row) return done(null, row);

    db.run("INSERT INTO users (username, discord_id) VALUES (?, ?)", [profile.username, profile.id], function(err) {
      if (err) return done(err);
      db.get("SELECT * FROM users WHERE discord_id = ?", [profile.id], (err, newUser) => {
        return done(null, newUser);
      });
    });
  });
}));

// ---------------- Routes ----------------

// Home
app.get("/", (req, res) => {
  res.redirect(req.session.user || req.user ? "/dashboard" : "/login");
});

// Login/Register
app.get("/login", (req, res) => res.render("login"));
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (!user) return res.send("Invalid username or password");
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send("Invalid username or password");
    req.session.user = { id: user.id, username: user.username };
    res.redirect("/dashboard");
  });
});

app.get("/register", (req, res) => res.render("register"));
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
  if (!(req.session.user || req.user)) return res.redirect("/login");
  res.render("dashboard", { user: req.session.user || req.user });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// ---------------- Discord OAuth ----------------

// Redirect user to Discord OAuth
app.get("/auth/discord", (req, res, next) => {
  // Save the origin dynamically in session (local, Replit, Codespaces)
  req.session.origin = req.get("origin") || `${req.protocol}://${req.get("host")}`;
  passport.authenticate("discord")(req, res, next);
});

// Callback route (fixed for Discord)
app.get("/discord/callback", passport.authenticate("discord", { failureRedirect: "/login" }), (req, res) => {
  req.session.user = { id: req.user.discord_id || req.user.id, username: req.user.username };
  
  // Redirect back to the original host
  const redirectTo = req.session.origin ? `${req.session.origin}/dashboard` : "/dashboard";
  res.redirect(redirectTo);
});

// ---------------- Start Server ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
