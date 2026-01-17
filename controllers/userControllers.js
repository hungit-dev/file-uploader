const { prisma } = require("../lib/prisma.js");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const passport = require("../passport-config");
const { getFolderHierarchy } = require("../models/folder.js");

const validateSignUpForm = [
  body("name").trim().notEmpty().withMessage("Name cannot be empty."),
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username cannot be empty")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long."),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password cannot be empty")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long."),

  body("confirm-password")
    .trim()
    .notEmpty()
    .withMessage("Confirm password cannot be empty"),
];
const renderIndexPage = (req, res) => {
  return res.render("index");
};
const createNewUser = async (req, res) => {
  try {
    //validate sign up form
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("sign-up-page", { errors: errors.array() });
    }
    if (req.body.password !== req.body["confirm-password"]) {
      return res.render("sign-up-page", {
        errors: [{ msg: "Passwords does not match" }],
      });
    }
    //check if user exists
    const isUserExist = await prisma.user.findUnique({
      where: {
        username: req.body.username,
      },
    });
    if (isUserExist) {
      res.render("sign-up-page", {
        errors: [{ msg: "username already exists" }],
      });
    }
    // hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    // create user
    const user = await prisma.user.create({
      data: {
        name: req.body.name,
        username: req.body.username,
        password: hashedPassword,
      },
    });
    return res.redirect("/log-in");
  } catch (e) {
    console.log(e);
    res.status(500).send("Server error");
  }
};

const renderSignUpPage = (req, res) => {
  try {
    return res.render("sign-up-page", { errors: [] });
  } catch (e) {
    console.log(e);
    res.status(500).send("Server error");
  }
};

const renderLogInPage = (req, res) => {
  try {
    const errorMessages = req.flash("error").map((msg) => ({ msg }));
    return res.render("log-in-page", { errors: errorMessages });
  } catch (e) {
    console.log(e);
    res.status(500).send("Server error");
  }
};

const renderDashboardPage = async (req, res) => {
  try {
    const folders = await prisma.folder.findMany({
      //find top-level folders
      where: {
        userId: req.user.id,
        parentId: null,
      },
      orderBy: {
        id: "asc",
      },
    });
    console.log(folders);
    //Set the parent folder to the dashboard folder
    req.session.currentFolderId = null;
    //Save session before rendering view
    req.session.save((err) => {
      if (err) {
        console.log("Session save error:", err);
        return res.status(500).send("Server error");
      }
      return res.render("dashboard-folder-view", {
        username: req.user.name,
        files: false,
        folders: folders,
        breadcrumbItems: [{ name: "Dashboard" }],
      });
    });
  } catch (e) {
    console.log(e);
    res.status(500).send("Server error");
  }
};

const renderFolderView = async (req, res) => {
  try {
    const parentId = Number(req.params.parentId);
    const folders = await prisma.folder.findMany({
      where: {
        userId: req.user.id,
        parentId: parentId,
      },
      orderBy: {
        id: "asc",
      },
    });
    //set the parent folder to the current rendering folder
    req.session.currentFolderId = parentId;
    //Make sure the session is saved before rendering view
    req.session.save(async (err) => {
      if (err) {
        console.log("Session save error:", err);
        return res.status(500).send("Server error");
      }
      //test
      const breadcrumbItems = await getFolderHierarchy(
        req.user.id,
        req.session.currentFolderId,
      );

      return res.render("dashboard-folder-view", {
        username: req.user.name,
        files: false,
        folders: folders,
        breadcrumbItems: breadcrumbItems,
      });
    });
  } catch (e) {
    console.log(e);
    res.status(500).send("Server error");
  }
};

const renderHomePage = (req, res) => {
  try {
    if (req.user) {
      return res.redirect("/dashboard");
    } else {
      return res.redirect("/index");
    }
  } catch (e) {
    console.log(e);
    res.status(500).send("Server error");
  }
};

const logInUser = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash("error", info.message);
      // Force session save before redirect
      return req.session.save(() => {
        res.redirect("/log-in");
      });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      req.session.save(() => {
        res.redirect("/dashboard");
      });
    });
  })(req, res, next);
};

const handleUploadFile = (req, res, next) => {
  console.log(req.file);
  res.redirect("/dashboard");
};

const createNewFolder = async (req, res) => {
  try {
    const userId = req.user.id;
    const folderName = req.body["folder-name"];
    const parentFolderId = req.session.currentFolderId;
    const newFolder = await prisma.folder.create({
      data: {
        name: folderName,
        userId: userId,
        parentId: parentFolderId,
      },
    });
    //redirect to the current subfolder if user is in subfolder, else redirect to dashboard page
    if (parentFolderId) res.redirect(`/dashboard/folders/${parentFolderId}`);
    else res.redirect("/dashboard");
  } catch (e) {
    console.log(e);
    res.status(500).send("Server error");
  }
};
const editFolder = async (req, res) => {
  try {
    const parentFolderId = req.session.currentFolderId;
    const folderId = Number(req.params.folderId);
    const folder = await prisma.folder.update({
      where: {
        id: folderId,
      },
      data: {
        name: req.body["folder-name"],
      },
    });
    //redirect to the current subfolder if user is in subfolder, else redirect to dashboard page
    if (parentFolderId) res.redirect(`/dashboard/folders/${parentFolderId}`);
    else res.redirect("/dashboard");
  } catch (e) {
    console.log(e);
    res.status(500).send("Server error");
  }
};
const deleteFolder = async (req, res) => {
  try {
    const folderId = Number(req.params.folderId);
    const parentFolderId = req.session.currentFolderId;
    const deletedFolder = await prisma.folder.delete({
      where: {
        id: folderId,
      },
    });
    //redirect to the current subfolder if user is in subfolder, else redirect to dashboard page
    if (parentFolderId) res.redirect(`/dashboard/folders/${parentFolderId}`);
    else res.redirect("/dashboard");
  } catch (e) {
    console.log(e);
    res.status(500).send("Server error");
  }
};
module.exports = {
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
};
