import mongoose, { Mongoose } from "mongoose";
import { required } from "zod/v4-mini";

const userSchema=mongoose.Schema({
    name:{
        type:String,
        max:255,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    isEmailValid:{
         type:Boolean,
         required:true,
         default:false
    },
    password:{
        type:String,
        max:255,

    }
},{
    timestamps:true
});

export const userData=mongoose.model('User',userSchema);

const sessionSchema= mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true

    },
    valid:{
        type:Boolean,
        required:true,
        default:true
    },
    userAgent:{
        type:String
    },
    // user-agent is a header sent by the clients's browser in https request. 
    // it provides info. about the device, os, browser version
    ip:{
        type:String,
        maxlength:255
    }
},{
    timestamps:true
});

export const session=mongoose.model('Session',sessionSchema);

const verifyEmailSchema= mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    token:{
        type:String,
        length:8,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now,
        required:true
    },
    expiresAt:{
        type:Date,
        required:true,
        default:()=>new Date(Date.now()+ 24*60*60*1000)
    }


    }
);

// Optional: Create an index to automatically remove expired documents
verifyEmailSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const emailSchema=mongoose.model('Email',verifyEmailSchema);