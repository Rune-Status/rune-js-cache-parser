import { join } from 'path';
import { Cache } from './cache/cache';
import { createWriteStream, writeFileSync } from 'fs';

const cache = new Cache('C:/.435cache', { widgets: true });

/*
console.log(cache.itemDefinitions.get(4151));
console.log(cache.npcDefinitions.get(0));
console.log(cache.locationObjectDefinitions.get(8689));
*/

console.log(JSON.stringify(cache.widgets.get(387), null, 4));

/*
const sprites = cache.sprites;

console.log(sprites.get('12:0'));
*/

/*
sprites.forEach((sprite, key) => {
    if(!sprite || !sprite.pixels || sprite.pixels.length === 0 || sprite.height === 0 || sprite.width === 0) {
        console.log('sprite ' + key + ' missing or corrupt');
        return;
    }

    sprite.toPng().pack().pipe(createWriteStream(join(__dirname, '../', 'data', 'img', key.replace(/:/g, '_') + '.png')));
});
*/
