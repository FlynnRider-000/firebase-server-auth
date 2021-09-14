const cookieParser = require("cookie-parser");
const session = require('express-session');
const csrf = require("csurf");
const bodyParser = require("body-parser");

const express = require("express");
const app = express();
const routes = require('./routes.js');

const csrfMiddleware = csrf({ cookie: true });

app.set('view engine', 'pug');
app.set('views','./views');

app.use(express.static("static"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
})); 
app.use(cookieParser());
app.use(session({secret: "Firebase Auth Secret!"}));
app.use(csrfMiddleware);

app.all("*", (req, res, next) => {
  res.cookie("XSRF-TOKEN", req.csrfToken());
  res.locals.csrftoken = req.csrfToken();
  next();
});

app.use('/', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
