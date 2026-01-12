const { Router } = require("express");
const indexRouter = Router();
const {
  validateSignUpForm,
  createNewUser,
  renderDashboardPage,
  renderFolderView,
  renderLogInPage,
  renderSignUpPage,
  logInUser,
  renderHomePage,
  handleUploadFile,
  createNewFolder,
} = require("../controllers/userControllers");

//implements multer to access uploaded files
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});
const upload = multer({ storage: storage });

//manage routes
indexRouter.post("/file-upload", upload.single("file"), handleUploadFile);
indexRouter.get("/", renderHomePage);
indexRouter.get("/sign-up", renderSignUpPage);
indexRouter.post("/sign-up", validateSignUpForm, createNewUser);
indexRouter.get("/log-in", renderLogInPage);
indexRouter.post("/log-in", logInUser);
indexRouter.get("/dashboard", renderDashboardPage);
indexRouter.get("/dashboard/folders/:parentId", renderFolderView);
indexRouter.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

indexRouter.post("/dashboard/folders/create-folder", createNewFolder);
module.exports = indexRouter;
