import { clearUserSession, clearVerifyEmailTokens, createAccessToken, createRefreshToken, createSession, createUser,  findUserById, findVerficationEmailToken,  getUserByEmail,  sendNewVerifyEmailLink, verifyUserEmailAndUpdate } from "../model/auth.model.js";
import argon2 from 'argon2';
import { loginUserSchema, registerUserSchema, verifyEmailSchema, verifyPasswordSchema } from "../validators/auth-validator.js";
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";
import { userData } from "../config/db.js";


export const indexPage=async(req,res)=>{
    // const isLoggedIn=req.cookies.isLoggedIn; // cookieparser in app.js is used for this
    // res.render("auth/index",{isLoggedIn});
    res.render('auth/index')
}

export const getRegisterPage=async(req,res)=>{
    if (req.user) return res.redirect('/');
    res.render("auth/register",{errors:req.flash("errors")});
}

export const postRegister=async(req,res)=>{
    try{

        if (req.user) return res.redirect('/');

        // const {name,email,password}=req.body; //removed for validation
        // console.log(req.body)

        const {data,error}= registerUserSchema.safeParse(req.body);
        // console.log(data)
        if(error){
            const errors=error.errors[0].message;
            req.flash("errors",errors)
            return res.redirect('/register');
        }

        const {name,email,password}=data;
        // console.log(data);

        const userExists= await getUserByEmail(email);
        // if(userExists) return res.redirect('/register');
        
        if(userExists){
            req.flash("errors","User already exist")
            return res.redirect('/register')
        }
        
        const hashedPassword= await argon2.hash(password);
        const user= await createUser({name,email,password:hashedPassword});

        await sendNewVerifyEmailLink({userId:user._id,email});
        
        return res.redirect('/login');
    }catch(err){
        console.error("Registration error:", err);
        res.status(500).send("Something went wrong");
    }
    
};

export const getLoginPage=async(req,res)=>{
     if (req.user) return res.redirect('/');
     res.render("auth/login",{errors:req.flash("errors")});
} 

export const postLogin=async(req,res)=>{
    try{

        if (req.user) return res.redirect('/');
        // res.setHeader("Set-Cookie","isLoggedIn=true; path:/;")

        // const {email,password}=req.body;
        const {data,error}=loginUserSchema.safeParse(req.body)
        if(error){
            const errors=error.errors[0].message;
            req.flash("errors",errors);
            return res.redirect('/login');
        }
        const {email,password}=data;


        const user= await getUserByEmail(email);

        // if(!user) return res.redirect('/login');
        if(!user){
            req.flash("errors","Invalid email or Password");
            return res.redirect('/login')
        }
        
        const pass= await argon2.verify(user.password,password)
        console.log(pass);
        if(!pass)  {
            req.flash("errors","Invalid email or Password");
            return res.redirect('/login')
        }

// --------------------------------This part is for jwt authentication ----------------------------------
        // res.cookie("isLoggedIn",true)

        // const token=generateToken({
        //     id:user._id,
        //     name:user.name,
        //     email:user.email

        // });

        // res.cookie("access_token",token)
//  -----------------------end ------------------------------

// ------------------hybrid authentication-------------------
   
// we need to create sessions

const sessionId= await createSession(user._id,{
    ip:req.clientIp,
    userAgent:req.headers["user-agent"],
})

// access_token
const accessToken=createAccessToken({
    id:user._id,
    name:user.name,
    email:user.email,
    isEmailValid:user.isEmailValid,
    sessionId
});

// refresh_token
const refreshToken=createRefreshToken(sessionId);

const baseConfig={httpOnly:true,secure:true} // https:true se koi js se cookie get nhi kr payega like(res.cookies),secure:true- only https pr chlega
res.cookie("access_token",accessToken,{
    ...baseConfig,
    maxAge:ACCESS_TOKEN_EXPIRY
});

res.cookie("refresh_token",refreshToken,{
    ...baseConfig,
    maxAge:REFRESH_TOKEN_EXPIRY
})

// ----------------end--------------------------
        res.redirect("/");
    }catch(error){
        console.error("Login error:", error);
        res.status(500).send("Something went wrong");
    }    


}

export const getMe=(req,res)=>{
    if(!req.user) return res.send("Not logged in");
    
    return res.send(`hey ${req.user.name}-${req.user.email}`)

}

export const logoutUser=async(req,res)=>{
    await clearUserSession(req.user.id);
    res.clearCookie("access_token");
    res.clearCookie("refresh_token")
    res.redirect('/login');
}

// -------------Profile Page --------------------
// export const getProfilePage=async(req,res)=>{
//     if(!req.user) return res.redirect('/login');
//     const userId=req.user._id;
//     const user=await findUserById(userId);
//     console.log(user)
//     if(!user) return res.redirect('/');

//     res.render('auth/profile',{
//         user:{
//             name:user.name,
//             email:user.email,
//             is_email_valid:user.is_email_valid,
//             createdAt:user.createdAt
//         }
//     })
// }

export const getProfilePage=async(req,res)=>{
  if (!req.user) return res.send("Not logged in");
  const user= await findUserById(req.user.id);
  if(!user) return res.redirect('/login');

  return res.render('auth/profile',{
     user:{
        id:user.id,
        name:user.name,
        email:user.email,
        createdAt:user.createdAt,
        isEmailValid:user.isEmailValid
     },

  })
};

// ---------------- Email verification -------------

export const getVerifyEmail=async(req,res)=>{
    if(!req.user || req.user.isEmailValid) return res.redirect('/');
    return res.render('auth/verify-email',{
        email:req.user.email
    })
}
    //----------------Resend Verification Link ------------

export const resendVerificationLink=async(req,res)=>{
   if(!req.user) return res.redirect("/");
   const user=await findUserById(req.user.id);
   if(!user || user.isEmailValid) return res.redirect("/");

console.log(req.user)
     await sendNewVerifyEmailLink({userId:req.user.id,email:req.user.email});
  

   res.redirect('/verify-email');

}

  //--------verifyEmailToken
  
  export const verifyEmailToken=async(req,res)=>{
    const {data,error}=verifyEmailSchema.safeParse(req.query);
    if(error){
        return res.send("Verification link invalid or expires!");
    }
    const token= await findVerficationEmailToken(data);
    if(!token) res.send("Verification link invalid or expired!");

    await verifyUserEmailAndUpdate(token.email);

    clearVerifyEmailTokens(token.email).catch(console.error);

    return res.redirect('/profile');

  }

//------End Email verification----------------- 

// --------------------- Edit Profile And Password-----------------------------------

export const getEditProfilePage=async(req,res)=>{
    if(!req.user) return res.redirect("/");

    const user = await findUserById(req.user.id);
    if(!user) return res.status(404).send("usernot found");

    return res.render("auth/edit-profile",{
        name:user.name,
        errors:req.flash("errors")
    });

}

export const postEditProfile=async(req,res)=>{
    const {newName}=req.body
    const user= await userData.findByIdAndUpdate(req.user.id,
        {name:newName.trim()},
        {new:true});
    return res.redirect('/profile');
}

// changePassword

export const getChangePassword=async(req,res)=>{
    if(!req.user) return res.redirect("/");
    return res.render('auth/change-password',{
        errors:req.flash("errors")
    })
}
// post change password
export const postChangePassword=async(req,res)=>{
    const {data,error}=verifyPasswordSchema.safeParse(req.body);
    if(error){
        const errors=error.errors[0].message;
        req.flash("errors",errors)
        return res.redirect('/change-password');
    }

    const {currentPassword,newPassword}=data

    const user=await findUserById(req.user.id);
    if (!user) return res.status(404).send("USer not found");
    const isPasswordValid= await argon2.verify(user.password,currentPassword)
        console.log(isPasswordValid);
        if(!isPasswordValid)  {
            req.flash("errors","Current Password that you entered is invalid");
            return res.redirect('/change-password')
        }
    
    const hashedNewPassword = await argon2.hash(newPassword);
    await userData.findByIdAndUpdate(user._id,
        {password:hashedNewPassword},
        {new:true}
    )
    return res.redirect('/profile')

}
// ----------------------End Edit Profile ------------------------------
