const { Router } = require("express");
const indexRouter = Router();
const {
  validateSignUpForm,
  renderIndexPage,
  createNewUser,
  renderDashboardPage,
  renderFolderView,
  renderLogInPage,
  renderSignUpPage,
  logInUser,
  renderHomePage,
  handleUploadFile,
  createNewFolder,
  editFolder,
  deleteFolder,
  deleteFile,
  downloadFile,
} = require("../controllers/controllers");

//implements multer to access uploaded files
const multer = require("multer");
//use memory storage for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//manage routes
indexRouter.post("/file-upload", upload.single("file"), handleUploadFile);
indexRouter.get("/", renderHomePage);
indexRouter.get("/index", renderIndexPage);
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
indexRouter.get("/dashboard/folders/:folderId/delete", deleteFolder);
indexRouter.post("/dashboard/folders/create-folder", createNewFolder);
indexRouter.post("/dashboard/folders/:folderId/edit-folder", editFolder);
indexRouter.get("/dashboard/files/:fileId", deleteFile);
indexRouter.get("/dashboard/files/:fileId/download", downloadFile);

module.exports = indexRouter;
