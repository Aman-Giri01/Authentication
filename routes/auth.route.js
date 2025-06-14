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

export const authRoute=router;