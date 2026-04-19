import connect from './CricAddaBackend/src/db/db.js';
import User from './CricAddaBackend/src/models/UserModels.js';

await connect();
const users = await User.find().lean();
console.log('Found users:', users.map(u=>({ _id: u._id.toString(), Email: u.Email }))); 
process.exit(0);
