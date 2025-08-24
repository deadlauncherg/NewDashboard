const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Fake in-memory DB
let users = [];
let payments = [];

// --- Pages ---
app.get("/", (req, res) => res.redirect("/login"));
app.get("/login", (req, res) => res.render("login", { error: null }));
app.get("/register", (req, res) => res.render("register", { error: null }));

// --- Handle login/register ---
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) res.redirect(`/plans?user=${encodeURIComponent(username)}`);
  else res.render("login", { error: "Invalid credentials, please try again." });
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) return res.render("register", { error: "User exists." });
  users.push({ username, password });
  res.redirect("/login");
});

// --- Plans & Payment pages ---
app.get("/plans", (req, res) => {
  const user = req.query.user;
  if (!user) return res.redirect("/login");
  res.render("plans", { user });
});

app.get("/payment", (req, res) => {
  const { plan, price, user } = req.query;
  if (!plan || !price || !user) return res.redirect("/plans");
  res.render("payment", { planName: plan, price, user });
});

// --- Confirm Payment (user submits UTR) ---
app.post("/confirm-payment", (req, res) => {
  const { planName, price, panelEmail, panelPassword, contactEmail, utr, user } = req.body;

  const paymentId = payments.length + 1;
  payments.push({
    id: paymentId,
    user,
    planName,
    price,
    panelEmail,
    panelPassword,
    contactEmail,
    utr,
    status: "pending"
  });

  res.render("confirm-payment", { 
    paymentId,
    status: "pending",
    utr,
    panelEmail,
    panelPassword,
    panelURL: "https://cp.chunkhost.site/",
    user
  });
});

// --- Check payment status (user view) ---
app.get("/confirm-payment/:id", (req, res) => {
  const payment = payments.find(p => p.id == req.params.id);
  if (!payment) return res.send("Payment not found");

  res.render("confirm-payment", {
    paymentId: payment.id,
    status: payment.status,
    utr: payment.utr,
    panelEmail: payment.panelEmail,
    panelPassword: payment.panelPassword,
    panelURL: "https://cp.chunkhost.site/",
    user: payment.user
  });
});

// --- Admin confirm page ---
app.get("/adminconfirm", (req, res) => {
  const pendingPayments = payments.filter(p => p.status === "pending");
  res.render("adminconfirm", { pendingPayments });
});

// --- Admin confirm action ---
app.post("/adminconfirm/:id", (req, res) => {
  const payment = payments.find(p => p.id == req.params.id);
  if (!payment) return res.send("Payment not found");

  // Mark as confirmed
  payment.status = "confirmed";

  res.redirect("/adminconfirm");
});

// --- Start server ---
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
