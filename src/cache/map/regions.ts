import { Cache } from '../cache';
import { IndexType } from '../index';
import { Archive } from '../archive';
import { logger } from '@runejs/logger/dist/logger';

export class Tile {
    flags: number = 0;
    height: number;
    attrOpcode: number;
    overlayId: number;
    overlayPath: number;
    overlayOrientation: number;
    underlayId: number;
    bridge: boolean;
    nonWalkable: boolean;

    public constructor(public x: number, public y: number, public level: number) {
    }

    public setFlags(flags: number): void {
        this.flags = flags;
        this.bridge = (this.flags & 0x2) == 0x2;
        this.nonWalkable = (this.flags & 0x1) == 0x1;
    }
}

export interface LocationObject {
    objectId: number;
    x: number;
    y: number;
    level: number;
    type: number;
    orientation: number;
}

export interface MapData {
    tiles: Tile[];
    locationObjects: LocationObject[];
}

function decodeTiles(mapArchive: Archive, mapRegionX: number, mapRegionY: number, loadAllTiles: boolean = false): Tile[] {
    const tiles: Tile[] = [];
    const buffer = mapArchive.content;

    for(let level = 0; level < 4; level++) {
        for(let x = 0; x < 64; x++) {
            for(let y = 0; y < 64; y++) {
                const tile = new Tile(x + mapRegionX, y + mapRegionY, level);

                while(true) {
                    const opcode = buffer.readUnsignedByte();

                    if(opcode === 0) {
                        break;
                    } else if(opcode === 1) {
                        tile.height = buffer.readUnsignedByte();
                        break;
                    } else if(opcode <= 49) {
                        tile.attrOpcode = opcode;
                        tile.overlayId = buffer.readByte();
                        tile.overlayPath = (opcode - 2) / 4;
                        tile.overlayOrientation = opcode - 2 & 3;
                    } else if(opcode <= 81) {
                        tile.setFlags(opcode - 49);
                    } else {
                        tile.underlayId = opcode - 81;
                    }
                }

                if(tile.flags > 0 || loadAllTiles) {
                    tiles.push(tile);
                }
            }
        }
    }

    return tiles;
}

function decodeObjects(locationArchive: Archive, mapRegionX: number, mapRegionY: number): LocationObject[] {
    const buffer = locationArchive.content;
    if(!buffer) {
        return [];
    }

    const objects: LocationObject[] = [];
    let objectId = -1;

    while(true) {
        const objectIdOffset = buffer.readSmart();

        if(objectIdOffset === 0) {
            break;
        }

        objectId += objectIdOffset;
        let objectPositionInfo = 0;

        while(true) {
            const objectPositionInfoOffset = buffer.readSmart();

            if(objectPositionInfoOffset === 0) {
                break;
            }

            objectPositionInfo += objectPositionInfoOffset - 1;

            const x = (objectPositionInfo >> 6 & 0x3f) + mapRegionX;
            const y = (objectPositionInfo & 0x3f) + mapRegionY;
            const level = objectPositionInfo >> 12 & 0x3;
            const objectMetadata = buffer.readUnsignedByte();
            const type = objectMetadata >> 2;
            const orientation = objectMetadata & 0x3;

            objects.push({ objectId, x, y, level, type, orientation });
        }
    }

    return objects;
}

export const decodeRegions = (cache: Cache): MapData => {
    const index = cache.indices.get(IndexType.MAPS);
    const tiles: Tile[] = [];
    const locationObjects: LocationObject[] = [];
    let missingXtea = 0;
    let validMaps = 0;

    for(let i = 0; i < 32768; i++) {
        const x = i >> 8;
        const y = i & 0xff;
        const worldX = (x & 0xff) * 64;
        const worldY = y * 64;

        const mapTileArchive = index.getFile(`m${x}_${y}`);
        let locationObjectArchive = index.getFile(`l${x}_${y}`);

        if(mapTileArchive === null) {
            continue;
        }

        validMaps++;

        tiles.push(...decodeTiles(mapTileArchive, worldX, worldY));

        if(locationObjectArchive === null) {
            missingXtea++;
            continue;
        }

        locationObjects.push(...decodeObjects(locationObjectArchive, worldX, worldY));
    }

    logger.info(`Decoded ${tiles.length} map tiles.`);
    logger.info(`Decoded ${locationObjects.length} location objects; missing XTEA keys for ${missingXtea}/${validMaps} files.`);

    return { tiles, locationObjects };
};
