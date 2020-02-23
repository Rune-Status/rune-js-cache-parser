import { join } from "path";
import { EarlyFormatGameCache } from './cache-old-format/early-format-game-cache';
import { NewFormatGameCache } from './cache-new-format/new-format-game-cache';

const earlyFormatCache = new EarlyFormatGameCache(join(__dirname, '../', 'cache'), { loadDefinitions: true, loadWidgets: false, loadMaps: true });
const newFormatCache = new NewFormatGameCache('C:/.435cache');

console.log(earlyFormatCache.itemDefinitions.get(4151));
console.log(newFormatCache.itemDefinitions.get(4151));
console.log(earlyFormatCache.npcDefinitions.get(0));
console.log(newFormatCache.npcDefinitions.get(0));
console.log(earlyFormatCache.landscapeObjectDefinitions.get(8689));
console.log(newFormatCache.landscapeObjectDefinitions.get(8689));
