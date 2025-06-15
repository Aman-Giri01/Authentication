import { Router } from "express";
import * as auth from '../controller/auth.controller.js'

const router=Router()

router
.route('/')
.get(auth.indexPage);

router.route('/register')
.get(auth.getRegisterPage)
.post(auth.postRegister)


router
.route('/login')
.get(auth.getLoginPage)
.post(auth.postLogin)

router
.route('/me')
.get(auth.getMe);

router.route('/logout')
.get(auth.logoutUser);

router.route('/profile')
.get(auth.getProfilePage);

router.route('/verify-email')
.get(auth.getVerifyEmail)

router.route('/resend-verification-link')
.post(auth.resendVerificationLink);

router.route('/verify-email-token')
.get(auth.verifyEmailToken);
export const authRoute=router;

