const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require('bcryptjs');
const {prisma}=require("./lib/prisma")
passport.use(
    new LocalStrategy(async(username,password,done)=>{
        try {
            const user= await prisma.user.findUnique({
                where: {
                    username:username
                }
            })
            console.log(user)
             if (!user) {
                return done(null, false, { message: "Incorrect username" });
            }
            const match= await bcrypt.compare(password,user.password)
            if(!match){
                return done(null,false,{message:"Incorrect passworrd"})
            }
            return done(null, user);
        }catch(e){
            return done(e)
        }
    })
)
passport.serializeUser((user,done)=>{
    done(null,user.id)
})
passport.deserializeUser(async(id,done)=>{
    try{
        const user=await prisma.user.findUnique({
            where:{
                id:id
            }
        })
        done(null,user)
    }catch(e){
        done(e)
    }
})
module.exports = passport;
