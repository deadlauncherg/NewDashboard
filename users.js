const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: "secret", resave: false, saveUninitialized: false }));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.use("/", require("./routes/index"));   // dashboard/home
app.use("/", require("./routes/login"));   // login system
app.use("/", require("./routes/discord")); // discord oauth

app.listen(PORT, () => console.log(`Dashboard running at http://localhost:${PORT}`));
