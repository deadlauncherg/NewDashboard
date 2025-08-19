const express = require("express");
const DiscordOAuth2 = require("discord-oauth2");
const router = express.Router();

const oauth = new DiscordOAuth2({
  clientId: "YOUR_CLIENT_ID",
  clientSecret: "YOUR_CLIENT_SECRET",
  redirectUri: "http://localhost:3000/callback"
});

router.get("/discord", (req, res) => {
  const url = oauth.generateAuthUrl({ scope: ["identify"] });
  res.redirect(url);
});

router.get("/callback", async (req, res) => {
  const code = req.query.code;
  const token = await oauth.tokenRequest({
    code: code,
    scope: "identify",
    grantType: "authorization_code"
  });
  const user = await oauth.getUser(token.access_token);
  req.session.user = { username: user.username, id: user.id };
  res.redirect("/");
});

module.exports = router;
