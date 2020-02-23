import { EarlyDefinitionIndex } from '../early-cache-indices';
import { EarlyCacheArchive } from '../early-cache-archive';
import { EarlyFormatNpcDefinition, NpcDefinition } from '../../definitions/npc-definition';

export function parseNpcDefinitions(indices: EarlyDefinitionIndex[], archive: EarlyCacheArchive): Map<number, NpcDefinition> {
    const buffer = archive.getFileData('npc.dat');
    const npcDefinitions: Map<number, NpcDefinition> = new Map<number, NpcDefinition>();

    indices.forEach(cacheIndex => {
        buffer.setReaderIndex(cacheIndex.offset);

        let name: string;
        let description: string;
        let boundary = 1;
        let sizeX = 128;
        let sizeY = 128;
        let models: number[];
        let animations = {
            stand: -1,
            walk: -1,
            turnAround: -1,
            turnRight: -1,
            turnLeft: -1
        };
        let turnDegrees = 32;
        let options: string[];
        let headModels: number[];
        let minimapVisible = true;
        let renderPriority = false;
        let combatLevel = -1;
        let headIcon = -1;
        let clickable = true;

        while(true) {
            const opcode = buffer.readUnsignedByte();

            if(opcode === 0) {
                break;
            }

            switch(opcode) {
                case 1:
                    const length = buffer.readUnsignedByte();
                    models = new Array(length);
                    for(let idx = 0; idx < length; ++idx) {
                        models[idx] = buffer.readUnsignedShortBE();
                    }
                    break;
                case 2:
                    name = buffer.readString();
                    break;
                case 3:
                    description = buffer.readString();
                    break;
                case 12:
                    boundary = buffer.readByte();
                    break;
                case 13:
                    animations.stand = buffer.readUnsignedShortBE();
                    break;
                case 14:
                    animations.walk = buffer.readUnsignedShortBE();
                    break;
                case 17:
                    animations.walk = buffer.readUnsignedShortBE();
                    animations.turnAround = buffer.readUnsignedShortBE();
                    animations.turnRight = buffer.readUnsignedShortBE();
                    animations.turnLeft = buffer.readUnsignedShortBE();
                    break;
                case 30: case 31: case 32: case 33: case 34: case 35: case 36: case 37: case 38: case 39:
                    if(!options) options = new Array(5);
                    let option = buffer.readString();
                    if(option === 'hidden') option = null;
                    options[opcode - 30] = option;
                    break;
                case 40:
                    const colorCount = buffer.readUnsignedByte();
                    for(let i = 0; i < colorCount; i++) {
                        buffer.readUnsignedShortBE(); // old model color
                        buffer.readUnsignedShortBE(); // new model color
                    }
                    break;
                case 60:
                    const headModelCount = buffer.readUnsignedByte();
                    headModels = new Array(headModelCount);
                    for(let i = 0; i < headModelCount; i++) {
                        headModels[i] = buffer.readUnsignedShortBE();
                    }
                    break;
                case 90:
                    buffer.readUnsignedShortBE(); // ???
                    break;
                case 91:
                    buffer.readUnsignedShortBE(); // ???
                    break;
                case 92:
                    buffer.readUnsignedShortBE(); // ???
                    break;
                case 93:
                    minimapVisible = false;
                    break;
                case 95:
                    combatLevel = buffer.readUnsignedShortBE();
                    break;
                case 97:
                    sizeX = buffer.readUnsignedShortBE();
                    break;
                case 98:
                    sizeY = buffer.readUnsignedShortBE();
                    break;
                case 99:
                    renderPriority = true;
                    break;
                case 100:
                    buffer.readByte(); // brightness
                    break;
                case 101:
                    buffer.readByte(); // contract *= 5
                    break;
                case 102:
                    headIcon = buffer.readUnsignedShortBE();
                    break;
                case 103:
                    turnDegrees = buffer.readUnsignedShortBE();
                    break;
                case 106:
                    let varBitId = buffer.readUnsignedShortBE();
                    let settingId = buffer.readUnsignedShortBE();
                    if(varBitId == 65535) varBitId = -1;
                    if(settingId == 65535) settingId = -1;
                    const childCount = buffer.readUnsignedByte();
                    for(let i = 0; i < childCount; i++) {
                        buffer.readUnsignedShortBE(); // child id
                    }
                    break;
            }
        }

        npcDefinitions.set(cacheIndex.id, {
            id: cacheIndex.id, format: 'EARLY', name, description, models, boundary, sizeX, sizeY, animations, turnDegrees, options, headModels,
            minimapVisible, renderPriority, combatLevel, headIcon, clickable
        } as EarlyFormatNpcDefinition);
    });

    return npcDefinitions;
}

