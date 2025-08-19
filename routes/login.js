const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
let users = require("../users");

router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.user = { username };
    return res.redirect("/");
  }
  res.send("Invalid login. <a href='/login'>Try again</a>");
});

module.exports = router;
