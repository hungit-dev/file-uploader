const { Router } = require("express");
const indexRouter = Router();
const controller = require("../controllers/indexController");

indexRouter.get("/", (req, res) => {
  console.log("work")
  res.render("index");
});

module.exports = indexRouter;
