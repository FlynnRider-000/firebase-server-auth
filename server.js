const cookieParser = require("cookie-parser");
const session = require('express-session');
const csrf = require("csurf");
const bodyParser = require("body-parser");
const express = require("express");

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://server-auth-41acc.firebaseio.com",
});

const {initializeApp} = require('firebase/app');
const { getAuth, sendPasswordResetEmail } = require('firebase/auth');
const config = {
  apiKey: "AIzaSyA5O9xBUG1e8BSHBRnJ5S7eJYcCj7EjVHE",
  authDomain: "teachery-6b46e.firebaseapp.com",
  projectId: "teachery-6b46e",
  storageBucket: "teachery-6b46e.appspot.com",
  messagingSenderId: "970997936850",
  appId: "1:970997936850:web:96ed2d92e37059e2e9330b",
  measurementId: "G-J4H8R0D53F"
};
const firebase_client = initializeApp(config);

const csrfMiddleware = csrf({ cookie: true });

const PORT = process.env.PORT || 3000;
const app = express();

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

app.get("/", function (req, res) {
  res.redirect('/login');
});

app.get("/login", function (req, res) {
  if (req.session.role == 'Admin') {
    res.redirect('/admin');
    return;
  } else if (req.session.role == 'User') {
    res.redirect('/user');
    return;
  }
  res.render("login.pug");
});

app.get("/signup", function (req, res) {
  if (req.session.role == 'Admin') {
    res.redirect('/admin');
    return;
  } else if (req.session.role == 'User') {
    res.redirect('/user');
    return;
  }
  res.render("signup.pug");
});

app.get("/forgot-password", (req, res) => {
  if (req.session.role == 'Admin') {
    res.redirect('/admin');
    return;
  } else if (req.session.role == 'User') {
    res.redirect('/user');
    return;
  }
  res.render("forgot-password.pug");
});

app.post("/forgot-password", (req, res) => {
  if (req.body.email) {
    const useremail = req.body.email;
    const auth = getAuth();
    sendPasswordResetEmail(auth, useremail)
      .then(() => {
        res.redirect('/login');
      })
      .catch((error) => {
        res.redirect('/login');
      });
  } else {
    res.redirect('/login');
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.clearCookie("session");
  res.redirect("/login");
});

app.get("/deleteuser", function (req, res) {
  if (req.session.uid != undefined) {
    admin
      .auth()
      .deleteUser(req.session.uid)
      .then(() => {
        res.redirect('/logout');
      })
      .catch((error) => {
        res.redirect('/logout');
      });
  } else {
    res.redirect("/login");
  }
});

app.get("/admin", function (req, res) {
  if (req.session.role == 'Admin') {
    res.render("admin/dashboard.pug", {user: req.session});
    return;
  }
  res.redirect('/');
});

app.get("/user", function (req, res) {
  if (req.session.role == 'User') {
    res.render("user/dashboard.pug", {user: req.session});
    return;
  }
  res.redirect('/');
});

app.get("/doLogin", function (req, res) {
  const sessionCookie = req.cookies.session || "";

  admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then(async (decodedClaims) => {
      if (decodedClaims.admin) {
        res.redirect("/admin");
      } else {
        res.redirect('/user');
      }
    })
    .catch((error) => {
      res.redirect("/login");
    });
});

app.post("/sessionLogin", (req, res) => {
  const idToken = req.body.idToken.toString();

  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  admin
    .auth()
    .createSessionCookie(idToken, { expiresIn })
    .then(
      async (sessionCookie) => {

        const dtoken = await admin
          .auth()
          .verifyIdToken(idToken);
        req.session.uid = dtoken.user_id;
        req.session.role = dtoken.admin ? 'Admin' : 'User';
        req.session.email = dtoken.email;
          
        const options = { maxAge: expiresIn, httpOnly: true };
        res.cookie("session", sessionCookie, options);
        res.end(JSON.stringify({ status: "success" }));
      },
      (error) => {
        res.status(401).send("UNAUTHORIZED REQUEST!");
      }
    );
});

app.post("/sessionSignup", async (req, res) => {
  const idToken = req.body.idToken.toString();

  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  if (req.body.usertype == 'admin'){
    await admin.auth().setCustomUserClaims(req.body.uid, {admin: true});
  } else {
    await admin.auth().setCustomUserClaims(req.body.uid, {admin: false});
  }

  admin
    .auth()
    .createSessionCookie(idToken, { expiresIn })
    .then(
      (sessionCookie) => {
        try {
          const options = { maxAge: expiresIn, httpOnly: true };
          res.cookie("session", sessionCookie, options);
          res.end(JSON.stringify({ status: "success" }));
        } catch(e) {
          console.log(e);
          res.status(401).send("UNAUTHORIZED REQUEST!");  
        }
      },
      (error) => {
        res.status(401).send("UNAUTHORIZED REQUEST!");
      }
    );
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
