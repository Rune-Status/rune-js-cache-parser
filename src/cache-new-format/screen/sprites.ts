import { NewFormatGameCache } from '../new-format-game-cache';
import { ReferenceTable } from '../reference-table';
import { RsBuffer } from '../../net/rs-buffer';
import { PNG } from 'pngjs';
import { logger } from '@runejs/logger/dist/logger';

function toRgba(num: number): number[] {
    num >>>= 0;
    const b = num & 0xFF,
        g = (num & 0xFF00) >>> 8,
        r = (num & 0xFF0000) >>> 16,
        a = ( (num & 0xFF000000) >>> 24 ) / 255;
    return [r, g, b, a];
}

export class Sprite {

    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    pixelIdx: number[];
    palette: number[];
    pixels: number[];

    public constructor(public id: number, public frame: number, public crc: number, public version: number,
                       public maxWidth: number, public maxHeight: number) {
    }

    public toPng() {
        const png = new PNG({
            width: this.width,
            height: this.height,
            filterType: -1
        });

        for(let x = 0; x < this.width; x++) {
            for(let y = 0; y < this.height; y++) {
                const pixel = this.pixels[this.width * y + x];
                const alpha = pixel >> 24;
                const rgba = toRgba(pixel);
                const pngIndex = (this.width * y + x) << 2;

                png.data[pngIndex] = rgba[0];
                png.data[pngIndex + 1] = rgba[1];
                png.data[pngIndex + 2] = rgba[2];
                png.data[pngIndex + 3] = alpha;
            }
        }

        return png;
    }

}

function parseSprite(id: number, crc: number, version: number, file: RsBuffer): Sprite[] {
    file.setReaderIndex(file.getBuffer().length - 2);
    const spriteCount = file.readUnsignedShortBE();
    const sprites: Sprite[] = new Array(spriteCount);

    file.setReaderIndex(file.getBuffer().length - 7 - spriteCount * 8);
    const width = file.readUnsignedShortBE();
    const height = file.readUnsignedShortBE();
    const paletteLength = file.readUnsignedByte() + 1;

    for(let i = 0; i < spriteCount; i++) {
        sprites[i] = new Sprite(id, i, crc, version, width, height);
    }

    for(let i = 0; i < spriteCount; i++) {
        sprites[i].offsetX = file.readUnsignedShortBE();
    }
    for(let i = 0; i < spriteCount; i++) {
        sprites[i].offsetY = file.readUnsignedShortBE();
    }
    for(let i = 0; i < spriteCount; i++) {
        sprites[i].width = file.readUnsignedShortBE();
    }
    for(let i = 0; i < spriteCount; i++) {
        sprites[i].height = file.readUnsignedShortBE();
    }

    file.setReaderIndex(file.getBuffer().length - 7 - spriteCount * 8 - (paletteLength - 1) * 3);
    const palette: number[] = new Array(paletteLength);

    for(let i = 1; i < paletteLength; i++) {
        palette[i] = file.readMediumBE();

        if(palette[i] === 0) {
            palette[i] = 1;
        }
    }

    file.setReaderIndex(0);

    for(let i = 0; i < spriteCount; i++) {
        const sprite = sprites[i];
        const spriteWidth = sprite.width;
        const spriteHeight = sprite.height;
        const dimension = spriteWidth * spriteHeight;
        const pixelPaletteIndicies: number[] = new Array(dimension);
        const pixelAlphas: number[] = new Array(dimension);
        sprite.palette = palette;

        const flags = file.readUnsignedByte();

        if((flags & 0b01) === 0) {
            for(let j = 0; j < dimension; j++) {
                pixelPaletteIndicies[j] = file.readByte();
            }
        } else {
            for(let x = 0; x < spriteWidth; x++) {
                for(let y = 0; y < spriteHeight; y++) {
                    pixelPaletteIndicies[spriteWidth * y + x] = file.readByte();
                }
            }
        }

        if((flags & 0b10) === 0) {
            for(let j = 0; j < dimension; j++) {
                const index = pixelPaletteIndicies[j];
                if(index !== 0) {
                    pixelAlphas[j] = 0xff;
                }
            }
        } else {
            if((flags & 0b01) === 0) {
                for(let j = 0; j < dimension; j++) {
                    pixelAlphas[j] = file.readByte();
                }
            } else {
                for(let x = 0; x < spriteWidth; x++) {
                    for(let y = 0; y < spriteHeight; y++) {
                        pixelAlphas[spriteWidth * y + x] = file.readByte();
                    }
                }
            }
        }

        sprite.pixelIdx = pixelPaletteIndicies;
        sprite.pixels = new Array(dimension);

        for(let j = 0; j < dimension; j++) {
            const index = pixelPaletteIndicies[j] & 0xff;
            sprite.pixels[j] = palette[index] | (pixelAlphas[j] << 24);
        }
    }

    return sprites;
}

export const parseSprites = (gameCache: NewFormatGameCache, referenceTable: ReferenceTable): Map<string, Sprite> => {
    const sprites = new Map<string, Sprite>();
    const spriteCount = referenceTable.entries.size;

    logger.info(`Parsing new format sprites...`);

    for(let i = 0; i < spriteCount; i++) {
        const entry = referenceTable.entries.get(i);
        const spriteFile = gameCache.getDecompressedFile(8, i);

        if(spriteFile && spriteFile.getBuffer().length > 0) {
            const parsedSprites = parseSprite(i, entry.crc, entry.version, spriteFile);

            for(const sprite of parsedSprites) {
                sprites.set(`${sprite.id}:${sprite.frame}`, sprite);
            }
        } else {
            if(entry) {
                sprites.set(`${i}:0`, new Sprite(i, 0, entry.crc, entry.version, 0, 0));
            } else {
                sprites.set(`${i}:0`, new Sprite(i, 0, -1, 0, 0, 0));
            }
        }
    }

    logger.info(`Parsed ${sprites.size} new format sprites.`);

    return sprites;
};
