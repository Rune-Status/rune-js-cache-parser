import { DefinitionIndex } from '../cache-indices';
import { CacheArchive } from '../cache-archive';

export interface NpcDefinition {
    id: number;
    name: string;
    description: string;
    boundary: number;
    sizeX: number;
    sizeY: number;
    animations: {
        stand: number;
        walk: number;
        turnAround: number;
        turnRight: number;
        turnLeft: number;
    };
    turnDegrees: number;
    actions: string[];
    headModels: number[];
    minimapVisible: boolean;
    invisible: boolean;
    combatLevel: number;
    headIcon: number;
    clickable: boolean;
}

export function parseNpcDefinitions(indices: DefinitionIndex[], archive: CacheArchive): Map<number, NpcDefinition> {
    const buffer = archive.getFileData('npc.dat');
    const npcDefinitions: Map<number, NpcDefinition> = new Map<number, NpcDefinition>();

    indices.forEach(cacheIndex => {
        buffer.setReaderIndex(cacheIndex.offset);

        let name: string;
        let description: string;
        let boundary = 1;
        let sizeX = 128;
        let sizeY = 128;
        let animations = {
            stand: -1,
            walk: -1,
            turnAround: -1,
            turnRight: -1,
            turnLeft: -1
        };
        let turnDegrees = 32;
        let actions: string[];
        let headModels: number[];
        let minimapVisible = true;
        let invisible = false;
        let combatLevel = -1;
        let headIcon = -1;
        let clickable = true;

        while(true) {
            const opcode = buffer.readUnsignedByte();

            if(opcode === 0) {
                break;
            }

            switch(opcode) {
                case 1: // NPC Models
                    const modelCount = buffer.readUnsignedByte();
                    for(let i = 0; i < modelCount; i++) {
                        buffer.readUnsignedShortBE();
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
                    if(!actions) actions = new Array(5);
                    let action = buffer.readString();
                    if(action === 'hidden') action = null;
                    actions[opcode - 30] = action;
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
                    invisible = true;
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
            id: cacheIndex.id, name, description, boundary, sizeX, sizeY, animations, turnDegrees, actions, headModels,
            minimapVisible, invisible, combatLevel, headIcon, clickable
        });
    });

    return npcDefinitions;
}

