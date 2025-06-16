import z from 'zod';

export const loginUserSchema=z.object({
    email:z
    .string()
    .trim()
    .email({message:"Please enter a valid email"})
    .max(100,{message:"Email must be no more than 100 characters."}),
    password:z
    .string()
    .min(6,{message:"Password must be atleast 6 character long."})
    .max(100,{message:"Paswword must be no more than 100 characters long."})
});

export const registerUserSchema=loginUserSchema.extend({
    name:z
    .string()
    .trim()
    .min(3,{message:"Name must be atleast 3 characters long."})
    .max(100,{message:"Name must be no more than 100 characters."}),
    confirmPassword:z
    .string()
    .min(6,{message:"Password must be atleast 6 character long."})
    .max(100,{message:"Paswword must be no more than 100 characters long."})

    
})


export const verifyEmailSchema=z.object({
    token:z.string().trim().length(8),
    email:z.string().trim().email(),
});

export const verifyPasswordSchema=z.object({
    currentPassword:z
    .string()
    .min(6,{
        message:"Current Password is required!"
    }),
    newPassword:z
    .string()
    .min(6,{message:"New Password must be atleast 6 characters long."})
    .max(100,{message:"New password must br no more than 100 characters."}),
    confirmPassword:z
    .string()
    .min(6,{
        message:"Confirm Password must be at least 6 character long."
    })
    .max(100,{
        message:"Confirm password must be no more than 100 characters."
    })
}).refine((data)=>data.newPassword === data.confirmPassword,{
    message:"Password don't match",
    path:["confirmPassword"]
});
