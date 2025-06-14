import mongoose from "mongoose";

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