import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";
import { refreshTokens, verifyJwtToken } from "../model/auth.model.js";

// ------------------- jwt authentication middleware---------

// export const verifyAuthentication=(req,res,next)=>{
//   const token=req.cookies.access_token;
//   if(!token){
//     req.user=null;
//     return next();
//   }
  
//   try {
//     const decodedToken=verifyJwtToken(token);
//     req.user=decodedToken;
//     // console.log(req.user);
//   } catch (error) {
//     req.user=null;
//   }
  
//   return next();

// }


// you can add any property to req, but:

// Avoid overwriting existing properties,
// Use req.user for Authentication,
// Group custom properties under req.custom if needed,
// keep the data lightweight

// -------------------- End -------------------------------------------

// --------------------- Hybrid Authentication -------------------

export const verifyAuthentication=async(req,res,next)=>{
    const access_token=req.cookies.access_token;
    const refresh_token=req.cookies.refresh_token;

    if(!access_token && !refresh_token){
        req.user=null;
        return next();
    }

    if(access_token){
        const decodedToken=verifyJwtToken(access_token);
        req.user=decodedToken;
        return next();
    }

    if(refresh_token){
        try {
            const {newAccessToken,newRefreshToken,user}=await  refreshTokens(refresh_token);
            req.user=user;

            const baseConfig={httpOnly:true,secure:true} // https:true se koi js se cookie get nhi kr payega like(res.cookies),secure:true- only https pr chlega
             res.cookie("access_token",newAccessToken,{
                 ...baseConfig,
                 maxAge:ACCESS_TOKEN_EXPIRY
             });
             
             res.cookie("refresh_token",newRefreshToken,{
                 ...baseConfig,
                 maxAge:REFRESH_TOKEN_EXPIRY
             })
             return next();

        } catch (error) {
            console.log(error.message);
        }
    }
    return next();
}

// ----------------------End -----------------------------------