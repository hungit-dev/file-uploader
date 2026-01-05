const { Router } = require("express");
const indexRouter = Router();
const {validateSignUpForm,createNewUser,renderDashboardPage,renderLogInPage,renderSignUpPage,logInUser,renderHomePage,handleUploadFile}=require("../controllers/userControllers");
const multer  = require('multer')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})
const upload = multer({ storage: storage })

indexRouter.post('/file-upload', upload.single('file'), handleUploadFile)

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
