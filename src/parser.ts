import { join } from "path";
import { GameCache } from './cache/game-cache';

const cache = new GameCache(join(__dirname, '../', 'cache'));

console.log(JSON.stringify(cache.landscapeObjectDefinitions.get(1551)), null, 4);
