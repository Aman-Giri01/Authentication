import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { authRoute } from './routes/auth.route.js';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import {verifyAuthentication} from './middlewares/verify.middleware.js';
import session from 'express-session';
import flash from 'connect-flash';
import requestIp from 'request-ip';


dotenv.config();
const PORT=process.env.PORT;
const uri=process.env.MONGODB_URL;

const app=express();

const staticPath=path.join(import.meta.dirname,"public")
app.use(express.urlencoded({extended:true}));
app.use(express.static(staticPath));



// cookieParser middleware is used to parse cookie (res.cookie)
app.use(cookieParser());

// session ko cookie parser baad or middleware ke upar
app.use(session({secret:'my-secret',resave:true,saveUninitialized:false})) //resave : save session in each request,saveUninitialized: sessioin empty ho to save mt krna
app.use(flash());

// requestIp middleware user to get ip address and we use it in session collection
app.use(requestIp.mw());  // mw() middleware is used to call method request.clientip

// This must be after cookieParser middleware and is used to verify jwt.sign
app.use(verifyAuthentication);

app.use((req,res,next)=>{
    res.locals.user=req.user;   //is se hm ejs file me user likh ke req.user ka data le skte hai
    return next();
});

// how it works:
// this middleware runs on every request before reaching the route handlers.
// res.locals is an object that persists throughout the request-response cycle
// if req.user exists (typically from Authentication, like Passport.js ) it's stored in 
// res.locals.user.

// Views (like EJS, Pug, or Handlebars) can directly access user without manually 
// passing it in every route.



app.use(authRoute);

const viewPath=path.join(import.meta.dirname,"views");
app.set("view engine","ejs");
app.set("views",viewPath);


app.listen(PORT,()=>console.log(`Server ruuning on PORT: ${PORT}`))


mongoose.connect(uri)
.then(()=>console.log('Database Connected.'))
.catch((error)=>console.log('error occurred: ', error))


// the connect-flash module relies on express-session tp function properly.
// Flash messages are temporarily stores in the session and then displayed to the user
// ont the next request, then cleared automatically. 

// This is why you need both packages. (connect-flash and express-session)

// simple : flash ki madad se hm message ko set krke use session me store kr denge.
// isko cookie session ke baad aur middleware ke upar rkhe