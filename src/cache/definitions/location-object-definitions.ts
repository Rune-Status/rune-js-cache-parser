import { JagexFile } from '../jagex-file';
import { Cache } from '../cache';
import { IndexType } from '../index';
import { logger } from '@runejs/logger/dist/logger';

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
        const opcode = buffer.readUnsignedByte();
        if(opcode == 0) {
            break;
        }

        if(opcode == 1) {
            const length = buffer.readUnsignedByte();
            if(length > 0) {
                for(let index = 0; length > index; index++) {
                    buffer.readUnsignedShortBE(); // model id
                    buffer.readUnsignedByte(); // model type
                }
            }
        } else if(opcode == 2) {
            def.name = buffer.readNewString();
        } else if(opcode == 5) {
            const length = buffer.readUnsignedByte();
            if(length > 0) {
                for(let index = 0; length > index; index++) {
                    buffer.readUnsignedShortBE(); // model id
                }
            }
        } else if(opcode == 14) {
            def.sizeX = buffer.readUnsignedByte();
        } else if(opcode == 15) {
            def.sizeY = buffer.readUnsignedByte();
        } else if(opcode == 17) {
            def.solid = false;
        } else if(opcode == 18) {
            def.aBoolean2528 = false;
        } else if(opcode == 19) {
            def.hasOptions = buffer.readUnsignedByte() === 1;
        } else if(opcode == 21) {
            def.adjustToTerrain = true;
        } else if(opcode == 22) {
            def.nonFlatShading = true;
        } else if(opcode == 23) {
            // def.unknownBoolean = true;
        } else if(opcode == 24) {
            def.animationId = buffer.readUnsignedShortBE();
            if(def.animationId == 0xFFFF) {
                def.animationId = -1;
            }
        } else if(opcode == 28) {
            buffer.readUnsignedByte();
        } else if(opcode == 29) {
            const ambient = buffer.readByte();
        } else if(opcode == 39) {
            const contrast = 5 * buffer.readByte();
        } else if(opcode >= 30 && opcode < 35) {
            def.options[opcode - 30] = buffer.readNewString();
            if(def.options[opcode + -30] === 'Hidden') {
                def.options[(opcode + -30)] = null;
            }
        } else if(opcode == 40) {
            const length = buffer.readUnsignedByte();
            for(let index = 0; index < length; index++) {
                (buffer.readUnsignedShortBE()); // old color
                (buffer.readUnsignedShortBE()); // new color
            }
        } else if(opcode == 60) {
            (buffer.readUnsignedShortBE()); // ??
        } else if(opcode == 62) {
            // aBoolean2553 = true;
        } else if(opcode == 64) {
            // aBoolean2541 = false;
        } else if(opcode == 65) {
            (buffer.readUnsignedShortBE()); // modelSizeX
        } else if(opcode == 66) {
            (buffer.readUnsignedShortBE()); // modelSizeHeight
        } else if(opcode == 67) {
            (buffer.readUnsignedShortBE()); // modelSizeY
        } else if(opcode == 68) {
            (buffer.readUnsignedShortBE()); // mapSceneID
        } else if(opcode == 69) {
            def.face = buffer.readUnsignedByte();
        } else if(opcode == 70) {
            def.translateX = (buffer.readShortBE());
        } else if(opcode == 71) {
            def.translateY = (buffer.readShortBE());
        } else if(opcode == 72) {
            def.translateLevel = (buffer.readShortBE());
        } else if(opcode == 73) {
            // unknown = true;
        } else if(opcode == 74) {
            // isSolid = true;
        } else if(opcode == 75) {
            buffer.readUnsignedByte(); // anInt2533
        } else if(opcode == 77) {
            buffer.readUnsignedShortBE(); // varbit id
            buffer.readUnsignedShortBE(); // settings id
            const length = buffer.readUnsignedByte();
            for(let index = 0; index <= length; ++index) {
                buffer.readUnsignedShortBE();
            }
        } else if(opcode == 78) {
            buffer.readUnsignedShortBE(); // anInt2513
            buffer.readUnsignedByte(); // anInt2502
        } else if(opcode == 79) {
            buffer.readUnsignedShortBE(); // anInt2499
            buffer.readUnsignedShortBE(); // anInt2542
            buffer.readUnsignedByte(); // anInt2502
            const length = buffer.readUnsignedByte();
            for(let index = 0; index < length; ++index) {
                buffer.readUnsignedShortBE(); // anIntArray2523[index]
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
