const cookieParser = require("cookie-parser");
const session = require('express-session');
const csrf = require("csurf");
const bodyParser = require("body-parser");

const express = require("express");
const app = express();
const routes = require('./routes.js');

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://server-auth-41acc.firebaseio.com",
});

const {initializeApp} = require('firebase/app');
const config = {
  apiKey: "AIzaSyA5O9xBUG1e8BSHBRnJ5S7eJYcCj7EjVHE",
  authDomain: "teachery-6b46e.firebaseapp.com",
  projectId: "teachery-6b46e",
  storageBucket: "teachery-6b46e.appspot.com",
  messagingSenderId: "970997936850",
  appId: "1:970997936850:web:96ed2d92e37059e2e9330b",
  measurementId: "G-J4H8R0D53F"
};
initializeApp(config);

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
