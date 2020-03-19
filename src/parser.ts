import { join } from "path";
import { EarlyFormatGameCache } from './cache-old-format/early-format-game-cache';
import { Cache } from './cache/cache';
import { createWriteStream, writeFileSync } from 'fs';

// const earlyFormatCache = new EarlyFormatGameCache(join(__dirname, '../', 'cache'), { loadDefinitions: true, loadWidgets: false, loadMaps: true });
const newFormatCache = new Cache('C:/.435cache', true);
/*
// console.log(earlyFormatCache.itemDefinitions.get(4151));
console.log(newFormatCache.itemDefinitions.get(4151));
// console.log(earlyFormatCache.npcDefinitions.get(0));
console.log(newFormatCache.npcDefinitions.get(0));
// console.log(earlyFormatCache.landscapeObjectDefinitions.get(8689));
console.log(newFormatCache.locationObjectDefinitions.get(8689));
*/
/*console.log(JSON.stringify(newFormatCache.widgetDefinitions.get(336).children[0], null, 4));

const sprites = newFormatCache.sprites;

console.log(sprites.get('12:0'));*/

/*sprites.forEach((sprite, key) => {
    if(!sprite || !sprite.pixels || sprite.pixels.length === 0 || sprite.height === 0 || sprite.width === 0) {
        console.log('sprite ' + key + ' missing or corrupt');
        return;
    }

    sprite.toPng().pack().pipe(createWriteStream(join(__dirname, '../', 'data', 'img', key.replace(/:/g, '_') + '.png')));
});*/
