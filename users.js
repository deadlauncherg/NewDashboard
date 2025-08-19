const bcrypt = require("bcrypt");

let users = [
  { username: "admin", password: bcrypt.hashSync("admin123", 10) }
];

module.exports = users;
