import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
Fullname : {type: String},
Email : {type:String},
Password : {type:String}
})

const userModel = mongoose.model('user',userSchema)
export default userModel