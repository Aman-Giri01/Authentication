import { ACCESS_TOKEN_EXPIRY, MILLISECONDS_PER_SECOND, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";
import { session, userData,emailSchema, resetPassword } from "../config/db.js";
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import {sendEmail} from '../lib/nodemailer.js'
import crypto from 'crypto';



export const getUserByEmail=async(emailId)=>{
    const user= await userData.findOne({email:emailId});
    return user;
}



export const createUser=async({name,email,password})=>{
   const register=await userData.create({
      name,
      email,
      password
   });
   return register;

}
// -----------------------this part is for jwt authentication--------------------
// // Jwt Sign (create token)

// export const generateToken=({id,name,email})=>{
//   return jwt.sign({id,name,email},process.env.JWT_SECRET,{
//     expiresIn:"30d"
//   })
// }

// // verifyJwtToken
// export const verifyJwtToken=(token)=>{
//     return jwt.verify(token,process.env.JWT_SECRET);

// }

// ------------------------end --------------------------------

// ----------------------now hybrid authentication (Both jwt and session(refresh token))---------

export const createSession=async(userId,{ip,userAgent})=>{
  const sessionId =await session.create({
    userId,
    ip,
    userAgent
  });
  return sessionId._id;

}

// access_token (jwt sign)
export const createAccessToken=({id,name,email,sessionId,isEmailValid})=>{
    return jwt.sign({id,name,email,sessionId,isEmailValid},process.env.JWT_SECRET,{
    expiresIn:ACCESS_TOKEN_EXPIRY/MILLISECONDS_PER_SECOND  //15 min
  })

};

// 

export const createRefreshToken=(sessionId)=>{
    return jwt.sign({sessionId},process.env.JWT_SECRET,{
    expiresIn:REFRESH_TOKEN_EXPIRY/MILLISECONDS_PER_SECOND  // 7 days
  })

};

// verifyJwtToken
export const verifyJwtToken=(token)=>{
    return jwt.verify(token,process.env.JWT_SECRET);

}

export const findSessionById=async(sessionI)=>{
  const sessionId=await session.findOne({_id:new mongoose.Types.ObjectId(sessionI)});
  return sessionId;
}

export const findUserById=async(userId)=>{
  const user= await userData.findById(userId);
  return user;
}

// refresh token (for creating accesstoken is it expire)

export const refreshTokens=async(refresh_token)=>{
  try {
    const decodedToken=verifyJwtToken(refresh_token);
    const currentSession=await findSessionById(decodedToken.sessionId);
    if(!currentSession || !currentSession.valid){
      throw new Error("Invalid Session")
    }

    const user=await findUserById(currentSession.userId);
    if(!user) throw new Error("Invalid user");

    const userInfo={
      id:user._id,
      name:user.name,
      email:user.email,
      isEmailValid:user.isEmailValid,
      sessionId:currentSession._id
    }

    const newAccessToken=createAccessToken(userInfo);
    const newRefreshToken=createRefreshToken(currentSession.id);

    return{
      newAccessToken,
      newRefreshToken,
      user:userInfo
    }


  } catch (error) {
    console.log(error.message)
  }
}

// clearUserSession

export const clearUserSession = async (userId) => {
  const result = await session.deleteMany({ userId });
  console.log("Deleted sessions:", result.deletedCount);
  return result;
};
// -------------end hybrid token----------------------

// -------------------------- verify Email ----------------
    //generate Random Token

export const generateRandomToken=(digit=8)=>{
  const min=10**(digit-1) //10000000
  const max=10**digit;  //100000000

  return crypto.randomInt(min,max).toString();
}

// insertVerifyEmailToken

export const insertVerifyEmailToken=async({userId,token})=>{
  
  await emailSchema.deleteMany({expiresAt: { $lt: new Date() }});

    // Delete any existing token for this user
  await emailSchema.deleteOne({ userId });

  return await emailSchema.create({
    userId,
    token,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
   });

};
// createVerifyEmailLink

export const createVerifyEmailLink=async({email,token})=>{
  // const uriEncodedEmail=encodeURIComponent(email);
  // return `${process.env.FRONTEND_URL}/verify-email-token?token=${token}&email=${uriEncodedEmail}`

   const url = new URL(`${process.env.FRONTEND_URL}/verify-email`);
  url.searchParams.append('token', token);
  url.searchParams.append('email', email);
  return url.toString();

};

// findVerficationEmailToken

export const findVerficationEmailToken=async({token,email})=>{
  const user = await userData.findOne({ email });
  if (!user) return null;

  const tokenData= await emailSchema.findOne({
    userId:user._id,
    token,
    expiresAt:{$gte: new Date()}
  });
  if (!tokenData) return null;

  return {
    userId: user._id,
    email: user.email,
    token: tokenData.token,
    expiresAt: tokenData.expiresAt,
  };
}
// verifyUserEmailAndUpdate
export const verifyUserEmailAndUpdate=async(email)=>{
  return await userData.updateOne({email},{$set:{isEmailValid:true}})
}

// clearVerifyEmailTokens
export const clearVerifyEmailTokens=async(email)=>{
  const user = await userData.findOne({ email });
  if (!user) return;

  return await emailSchema.deleteMany({
    userId: user._id,
  });
}

export const sendNewVerifyEmailLink=async({userId,email})=>{
 const randomToken=generateRandomToken();

   await insertVerifyEmailToken({userId,token:randomToken});

   const verifyEmailLink= await createVerifyEmailLink({
    email:email,
    token:randomToken
   });

   sendEmail({
    to:email,
    subject:"verify your email",
    html:`
    <h1> Click the link below ti verify your email</h1>
    <p>You can use this token: <code>${randomToken}</code></p>
    <a href="${verifyEmailLink}">Verify Email </a>`
   }).catch(console.error);

  }

//----------------------- end verify email ----------------------------

// ------------------------ Forgot Password----------------

export const findUserByEmail=async(email)=>{
  return await userData.findOne({email});
}

export const createResetPasswordLink=async({userId})=>{
  // random token
  const randomToken=crypto.randomBytes(32).toString("hex");

  // convert random token into hash
  const tokenHash=crypto
  .createHash("sha256")
  .update(randomToken)
  .digest("hex");

  // delete previous tokens
  await resetPassword.deleteMany({expiresAt: { $lt: new Date() }});

    // Delete any existing token for this user
  await resetPassword.deleteOne({ userId });

  // insert into db
  await resetPassword.create({
    userId,
    tokenHash:tokenHash,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000)
  })

  return `${process.env.FRONTEND_URL}/reset-password/${randomToken}`

}

// get ResetPasswordToken

export const getResetPasswordToken=async(token)=>{
  const tokenHash=crypto.createHash('sha256').update(token).digest("hex");

  const user=await resetPassword.findOne({
    tokenHash,
    expiresAt:{$gte:new Date()}
  });

  return user;
}

// clearResetPasswordToken
export const clearResetPasswordToken=async(userId)=>{
  await resetPassword.deleteMany({ userId });
}

// ------------------------end forgot password --------------------