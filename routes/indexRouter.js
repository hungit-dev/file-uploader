const { Router } = require("express");
const indexRouter = Router();
const controller = require("../controllers/indexController");

indexRouter.get("/", (req, res) => {
  res.render("index");
});
indexRouter.get("/sign-up",(req,res)=>{
  res.render("sign-up-page")
})
indexRouter.get("/log-in",(req,res)=>{
  res.render("log-in-page")
})
indexRouter.get("/dashboard",(req,res)=>{
  res.render("dashboard")
})
module.exports = indexRouter;
