const { getAuth, sendPasswordResetEmail } = require('firebase/auth');
var express = require('express');
var router = express.Router();

router.get("/", function (req, res) {
  res.redirect('/login');
});
  
router.get("/login", function (req, res) {
  if (req.session.role == 'Admin') {
    res.redirect('/admin');
    return;
  } else if (req.session.role == 'User') {
    res.redirect('/user');
    return;
  }
  if (req.session.fgp == 'success') {
    req.session.fgp = null;
    res.render("login.pug", {type:'success', msg: req.session.fgmsg});
  }
  else if (req.session.fgp == 'error') {
    req.session.fgp = null;
    res.render("login.pug", {type:'error', msg: req.session.fgmsg});
  }
  else
    res.render("login.pug");
});
  
router.get("/signup", function (req, res) {
  if (req.session.role == 'Admin') {
    res.redirect('/admin');
    return;
  } else if (req.session.role == 'User') {
    res.redirect('/user');
    return;
  }
  res.render("signup.pug");
});
  
router.get("/forgot-password", (req, res) => {
  if (req.session.role == 'Admin') {
    res.redirect('/admin');
    return;
  } else if (req.session.role == 'User') {
    res.redirect('/user');
    return;
  }
  res.render("forgot-password.pug");
});
  
router.post("/forgot-password", (req, res) => {
  if (req.body.email) {
    const useremail = req.body.email;
    const auth = getAuth();
    sendPasswordResetEmail(auth, useremail)
      .then(() => {
        req.session.fgp = 'success';
        req.session.fgmsg = 'Password reset link sent to your mail!';
        res.redirect('/login');
      })
      .catch((error) => {
        req.session.fgp = 'error';
        req.session.fgmsg = 'Something went wrong, please try again later!';
        if (error.code == 'auth/user-not-found') {
          req.session.fgmsg = 'There is no user record corresponding to this identifier!';
        }
        res.redirect('/login');
      });
  } else {
    res.redirect('/login');
  }
});
  
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.clearCookie("session");
  res.redirect("/login");
});
  
router.get("/deleteuser", function (req, res) {
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
  
router.get("/admin", function (req, res) {
  if (req.session.role == 'Admin') {
    res.render("admin/dashboard.pug", {user: req.session});
    return;
  }
  res.redirect('/');
});
  
router.get("/user", function (req, res) {
  if (req.session.role == 'User') {
    res.render("user/dashboard.pug", {user: req.session});
    return;
  }
  res.redirect('/');
});
  
router.get("/doLogin", function (req, res) {
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

router.post("/sessionLogin", (req, res) => {
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

        if (dtoken.email_verified){
          req.session.uid = dtoken.user_id;
          req.session.role = dtoken.admin ? 'Admin' : 'User';
          req.session.email = dtoken.email;
            
          const options = { maxAge: expiresIn, httpOnly: true };
          res.cookie("session", sessionCookie, options);
          res.end(JSON.stringify({ status: "success" }));
        } else {
          res.status(401).send("Verify your email!");  
        }
      },
      (error) => {
        res.status(401).send("UNAUTHORIZED REQUEST!");
      }
    );
});
  
router.post("/sessionSignup", async (req, res) => {
  if (req.body.usertype == 'admin'){
    await admin.auth().setCustomUserClaims(req.body.uid, {admin: true});
  } else {
    await admin.auth().setCustomUserClaims(req.body.uid, {admin: false});
  }

  res.status(201).send("success");
});

module.exports = router;