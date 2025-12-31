const { Router } = require("express");
const indexRouter = Router();
const {validateSignUpForm,createNewUser,renderDashboardPage,renderLogInPage,renderSignUpPage,logInUser,renderHomePage}=require("../controllers/userControllers")
indexRouter.get("/", renderHomePage);
indexRouter.get("/sign-up",renderSignUpPage)
indexRouter.post("/sign-up",validateSignUpForm,createNewUser)
indexRouter.get("/log-in",renderLogInPage)
indexRouter.post("/log-in",logInUser)
indexRouter.get("/dashboard",renderDashboardPage)

indexRouter.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
module.exports = indexRouter;
