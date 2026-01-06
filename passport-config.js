const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require('bcryptjs');
const {prisma}=require("./lib/prisma")
passport.use(
    new LocalStrategy(async(username,password,done)=>{
        try {
            //Log message if either username or password is empty
            if(!username || !password){
                return done(null,false,{message:"Username and password cannot be empty"})
            }
            const user= await prisma.user.findUnique({
                where: {
                    username:username
                }
            })
            console.log(user)

            //Log message if user types incorrect username
             if (!user) {
                return done(null, false, { message: "Incorrect username" });
            }

            //Log message if user types incorrect message
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
