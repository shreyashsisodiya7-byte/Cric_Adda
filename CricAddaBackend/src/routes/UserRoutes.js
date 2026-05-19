import express from "express"
import registerUserController from "../controllers/signupControllers.js"
import loginUserController from "../controllers/loginController.js"
import { verifyToken } from "../middlerware/authMiddleware.js";
import { deleteUserController } from "../controllers/signupControllers.js";


const Router = express.Router()


Router.post('/Signup',registerUserController)
Router.post('/login',loginUserController)
Router.delete('/delete/:userId', verifyToken, deleteUserController) 

export default Router