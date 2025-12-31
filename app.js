require("dotenv").config();
const express = require("express");
const expressSession = require("express-session");
const passport = require("./passport-config");
const path = require("node:path");
const assetsPath = path.join(__dirname, "public");
const indexRouter = require("./routes/indexRouter");
const flash=require("connect-flash")

const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const { prisma } = require('./lib/prisma.js');

const app = express();
/*use passport and store sessions in prisma*/
 app.use(
  expressSession({
    cookie: {
     maxAge: 7 * 24 * 60 * 60 * 1000 // ms
    },
    secret: 'a santa at nasa',
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(
      prisma,
      {
        checkPeriod: 2 * 60 * 1000,  //ms
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: undefined,
      }
    )
  })
);
 app.use(passport.initialize());
 app.use(passport.session());
 app.use(flash())
/*look and render ejs files*/
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

/*serve static file from specific folder*/
app.use(express.static(assetsPath));

/*read form submissions and use it values*/
app.use(express.urlencoded({ extended: true }));

/*use router*/
app.use("/", indexRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, (error) => {
  if (error) {
    throw error;
  }
  console.log(`Express app listening on port ${PORT}!`);
});
