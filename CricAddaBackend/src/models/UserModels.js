import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
Fullname : {type: String},
Email : {type:String},
Password : {type:String}
})

const userModel = mongoose.model('use',userSchema)
export default userModel