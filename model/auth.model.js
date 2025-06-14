import { ACCESS_TOKEN_EXPIRY, MILLISECONDS_PER_SECOND, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";
import { session, userData } from "../config/db.js";
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';



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
export const createAccessToken=({id,name,email,sessionId})=>{
    return jwt.sign({id,name,email,sessionId},process.env.JWT_SECRET,{
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
