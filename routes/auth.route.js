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

router.route('/edit-profile')
.get(auth.getEditProfilePage)
.post(auth.postEditProfile)

router.route('/change-password')
.get(auth.getChangePassword)
.post(auth.postChangePassword);

router.route('/reset-password')
.get(auth.getResetPasswordPage)
.post(auth.postResetPaswword)

router.route('/reset-password/:token')
.get(auth.getResetPasswordTokenPage)
.post(auth.postResetPasswordToken)
export const authRoute=router;

