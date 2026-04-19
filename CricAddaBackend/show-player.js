import connect from './src/db/db.js';
import Player from './src/models/PlayerModels.js';

await connect();
const player = await Player.findById('69b94aa08de0cede4a1da388').lean();
console.log('player photo field:', player.photo);
console.log('player doc:', player);
process.exit(0);
