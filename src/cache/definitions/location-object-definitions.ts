import { JagexFile } from '../jagex-file';
import { Cache } from '../cache';
import { IndexType } from '../index';
import { logger } from '@runejs/core';

export class LocationObjectDefinition {
    id: number;
    name: string;
    sizeX: number;
    sizeY: number;
    solid: boolean;
    nonWalkable: boolean;
    hasOptions: boolean;
    options: string[] = [ null, null, null, null, null ];
    adjustToTerrain: boolean;
    nonFlatShading: boolean;
    animationId: number;
    face: number;
    translateX: number;
    translateY: number;
    translateLevel: number;
    aBoolean2528: boolean;

    public constructor() {
        this.sizeX = 1;
        this.sizeY = 1;
        this.solid = true;
        this.nonWalkable = true;
        this.hasOptions = false;
        this.face = 0;
        this.translateX = 0;
        this.translateY = 0;
        this.translateLevel = 0;
        this.adjustToTerrain = false;
        this.nonFlatShading = false;
        this.animationId = -1;
    }
}

function decodeLocationObject(id: number, file: JagexFile): LocationObjectDefinition {
    const buffer = file.content;
    const def = new LocationObjectDefinition();
    def.id = id;

    while(true) {
        const opcode = buffer.get('BYTE', 'UNSIGNED');
        if(opcode == 0) {
            break;
        }

        if(opcode == 1) {
            const length = buffer.get('BYTE', 'UNSIGNED');
            if(length > 0) {
                for(let index = 0; length > index; index++) {
                    buffer.get('SHORT', 'UNSIGNED'); // model id
                    buffer.get('BYTE', 'UNSIGNED'); // model type
                }
            }
        } else if(opcode == 2) {
            def.name = buffer.getString();
        } else if(opcode == 5) {
            const length = buffer.get('BYTE', 'UNSIGNED');
            if(length > 0) {
                for(let index = 0; length > index; index++) {
                    buffer.get('SHORT', 'UNSIGNED'); // model id
                }
            }
        } else if(opcode == 14) {
            def.sizeX = buffer.get('BYTE', 'UNSIGNED');
        } else if(opcode == 15) {
            def.sizeY = buffer.get('BYTE', 'UNSIGNED');
        } else if(opcode == 17) {
            def.solid = false;
        } else if(opcode == 18) {
            def.aBoolean2528 = false;
        } else if(opcode == 19) {
            def.hasOptions = buffer.get('BYTE', 'UNSIGNED') === 1;
        } else if(opcode == 21) {
            def.adjustToTerrain = true;
        } else if(opcode == 22) {
            def.nonFlatShading = true;
        } else if(opcode == 23) {
            // def.unknownBoolean = true;
        } else if(opcode == 24) {
            def.animationId = buffer.get('SHORT', 'UNSIGNED');
            if(def.animationId == 0xFFFF) {
                def.animationId = -1;
            }
        } else if(opcode == 28) {
            buffer.get('BYTE', 'UNSIGNED');
        } else if(opcode == 29) {
            const ambient = buffer.get('BYTE');
        } else if(opcode == 39) {
            const contrast = 5 * buffer.get('BYTE');
        } else if(opcode >= 30 && opcode < 35) {
            def.options[opcode - 30] = buffer.getString();
            if(def.options[opcode + -30] === 'Hidden') {
                def.options[(opcode + -30)] = null;
            }
        } else if(opcode == 40) {
            const length = buffer.get('BYTE', 'UNSIGNED');
            for(let index = 0; index < length; index++) {
                (buffer.get('SHORT', 'UNSIGNED')); // old color
                (buffer.get('SHORT', 'UNSIGNED')); // new color
            }
        } else if(opcode == 60) {
            (buffer.get('SHORT', 'UNSIGNED')); // ??
        } else if(opcode == 62) {
            // aBoolean2553 = true;
        } else if(opcode == 64) {
            // aBoolean2541 = false;
        } else if(opcode == 65) {
            (buffer.get('SHORT', 'UNSIGNED')); // modelSizeX
        } else if(opcode == 66) {
            (buffer.get('SHORT', 'UNSIGNED')); // modelSizeHeight
        } else if(opcode == 67) {
            (buffer.get('SHORT', 'UNSIGNED')); // modelSizeY
        } else if(opcode == 68) {
            (buffer.get('SHORT', 'UNSIGNED')); // mapSceneID
        } else if(opcode == 69) {
            def.face = buffer.get('BYTE', 'UNSIGNED');
        } else if(opcode == 70) {
            def.translateX = (buffer.get('SHORT'));
        } else if(opcode == 71) {
            def.translateY = (buffer.get('SHORT'));
        } else if(opcode == 72) {
            def.translateLevel = (buffer.get('SHORT'));
        } else if(opcode == 73) {
            // unknown = true;
        } else if(opcode == 74) {
            // isSolid = true;
        } else if(opcode == 75) {
            buffer.get('BYTE', 'UNSIGNED'); // anInt2533
        } else if(opcode == 77) {
            buffer.get('SHORT', 'UNSIGNED'); // varbit id
            buffer.get('SHORT', 'UNSIGNED'); // settings id
            const length = buffer.get('BYTE', 'UNSIGNED');
            for(let index = 0; index <= length; ++index) {
                buffer.get('SHORT', 'UNSIGNED');
            }
        } else if(opcode == 78) {
            buffer.get('SHORT', 'UNSIGNED'); // anInt2513
            buffer.get('BYTE', 'UNSIGNED'); // anInt2502
        } else if(opcode == 79) {
            buffer.get('SHORT', 'UNSIGNED'); // anInt2499
            buffer.get('SHORT', 'UNSIGNED'); // anInt2542
            buffer.get('BYTE', 'UNSIGNED'); // anInt2502
            const length = buffer.get('BYTE', 'UNSIGNED');
            for(let index = 0; index < length; ++index) {
                buffer.get('SHORT', 'UNSIGNED'); // anIntArray2523[index]
            }
        }
    }

    return def;
}

/**
 * Parses the location object definition archive.
 * @param cache The game cache instance.
 */
export function decodeLocationObjectDefinitions(cache: Cache): Map<number, LocationObjectDefinition> {
    const archive = cache.getArchive(IndexType.DEFINITIONS, 6);
    const locationObjects = new Map<number, LocationObjectDefinition>();

    for(let i = 0; i < archive.files.size; i++) {
        const objectFile = archive.files.get(i);
        locationObjects.set(i, decodeLocationObject(i, objectFile));
    }

    logger.info(`Decoded ${locationObjects.size} location object definitions.`);

    return locationObjects;
}
