import { join } from "path";
import { GameCache } from './cache/game-cache';

new GameCache(join(__dirname, '../', 'cache'));
