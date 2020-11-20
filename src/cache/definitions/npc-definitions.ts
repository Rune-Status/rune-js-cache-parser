import { JagexFile } from '../jagex-file';
import { IndexType } from '../index';
import { Cache } from '../cache';
import { logger } from '@runejs/core';

export class NpcDefinition {
    id: number;
    name: string;
    animations: {
        stand: number;
        walk: number;
        turnAround: number;
        turnRight: number;
        turnLeft: number;
    };
    options: string[] = [ null, null, null, null, null ];
    models: number[];
    headModels: number[];
    minimapVisible: boolean;
    combatLevel: number;
    boundary: number;
    sizeX: number;
    sizeY: number;
    renderPriority: boolean;
    headIcon: number;
    clickable: boolean;
    turnDegrees: number;

    constructor() {
        this.animations = {
            stand: -1,
            walk: -1,
            turnAround: -1,
            turnRight: -1,
            turnLeft: -1
        };
        this.sizeX = 128;
        this.sizeY = 128;
        this.turnDegrees = 32;
        this.boundary = 1;
        this.minimapVisible = true;
        this.renderPriority = false;
        this.clickable = true;
        this.combatLevel = -1;
        this.headIcon = -1;
    }
}

function decodeNpc(id: number, file: JagexFile): NpcDefinition {
    const buffer = file.content;
    const def = new NpcDefinition();
    def.id = id;

    while(true) {
        const opcode = buffer.get('BYTE', 'UNSIGNED');
        if(opcode == 0) {
            break;
        }

        if(opcode == 1) {
            const length = buffer.get('BYTE', 'UNSIGNED');
            def.models = new Array(length);
            for(let idx = 0; idx < length; ++idx) {
                def.models[idx] = buffer.get('SHORT', 'UNSIGNED');
            }
        } else if(opcode == 2) {
            def.name = buffer.getString();
        } else if(opcode == 12) {
            def.boundary = buffer.get('BYTE', 'UNSIGNED');
        } else if(opcode == 13) {
            def.animations.stand = buffer.get('SHORT', 'UNSIGNED');
        } else if(opcode == 14) {
            def.animations.walk = buffer.get('SHORT', 'UNSIGNED');
        } else if(opcode == 15) {
            buffer.get('SHORT', 'UNSIGNED'); // junk
        } else if(opcode == 16) {
            buffer.get('SHORT', 'UNSIGNED'); // junk
        } else if(opcode == 17) {
            def.animations.walk = buffer.get('SHORT', 'UNSIGNED');
            def.animations.turnAround = buffer.get('SHORT', 'UNSIGNED');
            def.animations.turnRight = buffer.get('SHORT', 'UNSIGNED');
            def.animations.turnLeft = buffer.get('SHORT', 'UNSIGNED');
        } else if(opcode >= 30 && opcode < 35) {
            def.options[opcode - 30] = buffer.getString();
            if(def.options[opcode - 30] === 'Hidden') {
                def.options[-30 + opcode] = null;
            }
        } else if(opcode == 40) {
            // Model color replacement
            const length = buffer.get('BYTE', 'UNSIGNED');
            for(let i = 0; i < length; i++) {
                buffer.get('SHORT', 'UNSIGNED');
                buffer.get('SHORT', 'UNSIGNED');
            }
        } else if(opcode == 60) {
            const length = buffer.get('BYTE', 'UNSIGNED');
            def.headModels = new Array(length);
            for(let i = 0; length > i; i++) {
                def.headModels[i] = buffer.get('SHORT', 'UNSIGNED');
            }
        } else if(opcode == 93) {
            def.minimapVisible = false;
        } else if(opcode == 95) {
            def.combatLevel = buffer.get('SHORT', 'UNSIGNED');
        } else if(opcode == 97) {
            def.sizeX = buffer.get('SHORT', 'UNSIGNED');
        } else if(opcode == 98) {
            def.sizeY = buffer.get('SHORT', 'UNSIGNED');
        } else if(opcode == 99) {
            def.renderPriority = true;
        } else if(opcode == 100) {
            const ambient = buffer.get('BYTE');
        } else if(opcode == 101) {
            const contrast = (buffer.get('BYTE')) * 5;
        } else if(opcode == 102) {
            def.headIcon = (buffer.get('SHORT', 'UNSIGNED'));
        } else if(opcode == 103) {
            def.turnDegrees = (buffer.get('SHORT', 'UNSIGNED'));
        } else if(opcode == 106) {
            let varBitId = buffer.get('SHORT', 'UNSIGNED');
            let settingId = buffer.get('SHORT', 'UNSIGNED');
            if(varBitId == 65535) varBitId = -1;
            if(settingId == 65535) settingId = -1;
            const childCount = buffer.get('BYTE', 'UNSIGNED');
            for(let i = 0; childCount >= i; i++) {
                buffer.get('SHORT', 'UNSIGNED'); // child id
            }
        } else if(opcode == 107) {
            def.clickable = false;
        }
    }

    return def;
}

/**
 * Parses the NPC definition archive.
 * @param cache The game cache instance.
 */
export function decodeNpcDefinitions(cache: Cache): Map<number, NpcDefinition> {
    const archive = cache.getArchive(IndexType.DEFINITIONS, 9);
    const npcs = new Map<number, NpcDefinition>();

    for(let i = 0; i < archive.files.size; i++) {
        const npcFile = archive.files.get(i);
        npcs.set(i, decodeNpc(i, npcFile));
    }

    logger.info(`Decoded ${npcs.size} NPC definitions.`);

    return npcs;
}
