const { prisma } = require('../lib/prisma.js');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const passport=require("../passport-config")

const validateSignUpForm = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty."),
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
    .withMessage("Confirm password cannot be empty")
];

const createNewUser = async (req,res) => {
  try {
  //validate sign up form
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
      return res.render("sign-up-page", { errors: errors.array() });
    }
      if(req.body.password !== req.body["confirm-password"]){
        return res.render("sign-up-page", { errors: [{msg:"Passwords does not match"}] });
      }

  //check if user exists
  const isUserExist = await prisma.user.findUnique({
    where: {
      username:req.body.username,
    },
})
  if(isUserExist){
    res.render("sign-up-page",{errors:[{msg:"username already exists"}]})
  }
    // hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // create user
    const user = await prisma.user.create({
      data: {
        name: req.body.name,
        username: req.body.username,
        password: hashedPassword
      }
    });
    return res.redirect("/log-in")
  } catch (e) {
    console.error(e);
  }
};
const renderSignUpPage=(req,res)=>{
    try{
      return res.render("sign-up-page",{errors:[]})
    }catch(e){
      console.log(e)
    }
}
const renderLogInPage=(req,res)=>{
    try{
      const errorMessages = req.flash("error").map(msg => ({ msg }));
      return res.render("log-in-page",{errors:errorMessages})
    }catch(e){
      console.log(e)
    }
}
const renderDashboardPage=(req,res)=>{
    try{
      return res.render("dashboard",{username:req.user.name})
    }catch(e){
      console.log(e)
    }
}
const renderHomePage=(req,res)=>{
  try{
    if(req.user){
      return res.redirect("/dashboard")
    }else{
      return res.redirect("/log-in")
    }
  }catch(e){
    console.log(e)
  }
}
const logInUser=(req, res, next) => {
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
}
module.exports = {
  validateSignUpForm,
  createNewUser,
  renderDashboardPage,
  renderLogInPage,
  renderSignUpPage,
  logInUser,
  renderHomePage
};