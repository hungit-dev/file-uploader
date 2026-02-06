const { prisma } = require("../lib/prisma.js");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const passport = require("../passport-config.js");
const { getFolderHierarchy } = require("../models/folder.js");
const cloudinary = require("../cloudinary-config.js");
const fs = require("fs");

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
    //authorize user
    if (!req.user)
      return res.send(
        "You are not authorized to go to this route. Please log in!",
      );

    // Prevent caching to ensure back button reloads the page
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
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
    // find top-level files
    const files = await prisma.file.findMany({
      where: { userId: req.user.id, folderId: null },
      orderBy: {
        id: "asc",
      },
    });
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
        files: files,
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
    //authorize user
    if (!req.user)
      return res.send(
        "You are not authorized to go to this route. Please log in!",
      );
    // Prevent caching to ensure back button reloads the page
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
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
    const files = await prisma.file.findMany({
      where: { userId: req.user.id, folderId: parentId },
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
        files: files,
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

const handleUploadFile = async (req, res) => {
  // Image types
  const imageTypes = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "svg",
    "webp",
    "ico",
    "tiff",
  ];

  // Video types
  const videoTypes = ["mp4", "mov", "avi", "wmv", "webm", "flv", "mkv"];

  try {
    if (!req.file) throw new Error("No file uploaded");

    // Upload to Cloudinary directly from memory buffer
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "uploads",
          access_mode: "public",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );

      stream.end(req.file.buffer);
    });

    if (!result) throw new Error("Cannot upload");

    const userId = req.user.id;
    const url = result.secure_url;
    const fileName = req.file.originalname;
    const size = Number(req.file.size);
    const parentFolderId = req.session.currentFolderId;

    const fileType = imageTypes.includes(result.format)
      ? "Image"
      : videoTypes.includes(result.format)
        ? "Video"
        : "Pdf";

    const file = await prisma.file.create({
      data: {
        userId: userId,
        name: fileName,
        size: size,
        fileType: fileType,
        url: url,
        folderId: parentFolderId,
      },
    });

    console.log(file);

    // Redirect to correct folder
    if (parentFolderId) res.redirect(`/dashboard/folders/${parentFolderId}`);
    else res.redirect("/dashboard");
  } catch (err) {
    console.error("File upload error:", err);
    res.status(500).send("File upload failed");
  }
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
    // Get the folder's parent before deleting it
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });
    if (!folder) {
      return res.status(404).send("Folder not found");
    }
    const parentFolderId = folder.parentId;
    // delete folder
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
const deleteFile = async (req, res) => {
  try {
    const fileId = Number(req.params.fileId);
    const file = await prisma.file.delete({
      where: {
        id: fileId,
      },
    });
    const parentFolderId = req.session.currentFolderId;
    if (parentFolderId) res.redirect(`/dashboard/folders/${parentFolderId}`);
    else res.redirect("/dashboard");
  } catch (e) {
    console.log(e);
    res.status(500).send("Server error");
  }
};
const downloadFile = async (req, res) => {
  try {
    const fileId = Number(req.params.fileId);
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });
    if (!file) {
      return res.status(404).send("File not found");
    }
    // Verify the file belongs to the current user
    if (file.userId !== req.user.id) {
      return res.status(403).send("Access denied");
    }
    // Insert fl_attachment into Cloudinary URL
    const downloadUrl = file.url.replace("/upload/", "/upload/fl_attachment/");

    res.redirect(downloadUrl);
  } catch (e) {
    console.log(e);
    res.status(500).send("Download failed");
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
  deleteFile,
  downloadFile,
};
