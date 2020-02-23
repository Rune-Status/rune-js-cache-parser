import { EarlyDefinitionIndex } from '../early-cache-indices';
import { EarlyCacheArchive } from '../early-cache-archive';
import {
    EarlyFormatLandscapeObjectDefinition,
    LandscapeObjectDefinition
} from '../../definitions/landscape-object-definition';

export function parseLandscapeObjectDefinitions(indices: EarlyDefinitionIndex[], archive: EarlyCacheArchive): Map<number, LandscapeObjectDefinition> {
    const buffer = archive.getFileData('loc.dat');
    const landscapeObjectDefinitions: Map<number, LandscapeObjectDefinition> = new Map<number, LandscapeObjectDefinition>();

    indices.forEach(cacheIndex => {
        buffer.setReaderIndex(cacheIndex.offset);

        let name: string;
        let description: string;
        let sizeX: number = 1;
        let sizeY: number = 1;
        let solid: boolean = true;
        let nonWalkable: boolean = true;
        let hasOptions: boolean = false;
        let options: string[] = null;
        let face: number = 0;
        let translateX: number = 0;
        let translateY: number = 0;
        let translateLevel: number = 0;
        let adjustToTerrain = false;
        let nonFlatShading = false;
        let animationId = -1;

        while(true) {
            const opcode = buffer.readUnsignedByte();

            if(opcode === 0) {
                break;
            }

            switch(opcode) {
                case 1:
                    const modelCount1 = buffer.readUnsignedByte();
                    for(let modelIdx1 = 0; modelIdx1 < modelCount1; modelIdx1++) {
                        buffer.readShortBE(); // model id
                        buffer.readByte(); // model type
                    }
                    break;
                case 2:
                    name = buffer.readString();
                    break;
                case 3:
                    description = buffer.readString();
                    break;
                case 5:
                    const modelCount2 = buffer.readUnsignedByte();
                    for(let modelIdx2 = 0; modelIdx2 < modelCount2; modelIdx2++) {
                        buffer.readShortBE(); // model id
                    }
                    break;
                case 14:
                    sizeX = buffer.readUnsignedByte();
                    break;
                case 15:
                    sizeY = buffer.readUnsignedByte();
                    break;
                case 17:
                    solid = false;
                    break;
                case 18:
                    nonWalkable = false;
                    break;
                case 19:
                    hasOptions = buffer.readUnsignedByte() === 1;
                    if(options === null) {
                        options = new Array(5);
                    }
                    break;
                case 21:
                    adjustToTerrain = true;
                    break;
                case 22:
                    nonFlatShading = true;
                    break;
                case 23:
                    // ??? some flag set to true
                    break;
                case 24:
                    animationId = buffer.readShortBE(); // animation ID
                    break;
                case 28:
                    buffer.readByte(); // ???
                    break;
                case 29:
                    buffer.readByte(); // model light something?
                    break;
                case 39:
                    buffer.readByte(); // model ambient light?
                    break;
                case 30: case 31: case 32: case 33: case 34: case 35: case 36: case 37: case 38:
                    if(options === null) {
                        options = new Array(5);
                    }
                    options[opcode - 30] = buffer.readString();
                    break;
                case 40:
                    const colorCount = buffer.readUnsignedByte();
                    for(let colorIdx = 0; colorIdx < colorCount; colorIdx++) {
                        buffer.readShortBE(); // color being replaced
                        buffer.readShortBE(); // new color
                    }
                    break;
                case 60:
                    buffer.readShortBE(); // minimap icon id
                    break;
                case 62:
                case 64:
                    // ??? some flags set to true
                    break;
                case 65:
                case 66:
                case 67:
                    buffer.readShortBE(); // model size x/y/z
                    break;
                case 68:
                    buffer.readShortBE(); // map scene id
                    break;
                case 69: // nice
                    face = buffer.readUnsignedByte();
                    break;
                case 70:
                    translateX = buffer.readShortBE();
                    break;
                case 71:
                    translateY = buffer.readShortBE();
                    break;
                case 72:
                    translateLevel = buffer.readShortBE();
                    break;
                case 73:
                    // ??? some flag set to true
                    break;
                case 74:
                    // ??? some flag set to true
                    break;
                case 75:
                    buffer.readUnsignedByte(); // ???
                    break;
                case 77:
                    buffer.readShortBE(); // varbit id
                    buffer.readShortBE(); // settings id
                    const childrenCount = buffer.readUnsignedByte();
                    for(let childIdx = 0; childIdx < childrenCount; childIdx++) {
                        buffer.readShortBE(); // child id
                    }
                    break;
            }
        }

        landscapeObjectDefinitions.set(cacheIndex.id, {
            id: cacheIndex.id, format: 'EARLY', name, description, sizeX, sizeY, solid, nonWalkable, hasOptions, options, face, translateX, translateY, translateLevel,
            adjustToTerrain, nonFlatShading, animationId
        } as EarlyFormatLandscapeObjectDefinition);
    });

    return landscapeObjectDefinitions;
}
