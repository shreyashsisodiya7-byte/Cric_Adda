import express from "express"
import registerUserController from "../controllers/signupControllers.js"
import loginUserController from "../controllers/loginController.js"


const Router = express.Router()


Router.post('/Signup',registerUserController)
Router.post('/login',loginUserController)

export default Router