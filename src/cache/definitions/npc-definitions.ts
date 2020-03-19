import { RsBuffer } from '../../net/rs-buffer';
import { NewFormatNpcDefinition, NpcDefinition } from '../../definitions/npc-definition';
import { Archive } from '../archive';

function decodeNpcDefinition(id: number, buffer: RsBuffer): NpcDefinition {
    const def = new NewFormatNpcDefinition();
    def.id = id;

    while(true) {
        const opcode = buffer.readUnsignedByte();
        if(opcode == 0) {
            break;
        }

        if(opcode == 1) {
            const length = buffer.readUnsignedByte();
            def.models = new Array(length);
            for(let idx = 0; idx < length; ++idx) {
                def.models[idx] = buffer.readUnsignedShortBE();
            }
        } else if(opcode == 2) {
            def.name = buffer.readNewString();
        } else if(opcode == 12) {
            def.boundary = buffer.readUnsignedByte();
        } else if(opcode == 13) {
            def.animations.stand = buffer.readUnsignedShortBE();
        } else if(opcode == 14) {
            def.animations.walk = buffer.readUnsignedShortBE();
        } else if(opcode == 15) {
            buffer.readUnsignedShortBE(); // junk
        } else if(opcode == 16) {
            buffer.readUnsignedShortBE(); // junk
        } else if(opcode == 17) {
            def.animations.walk = buffer.readUnsignedShortBE();
            def.animations.turnAround = buffer.readUnsignedShortBE();
            def.animations.turnRight = buffer.readUnsignedShortBE();
            def.animations.turnLeft = buffer.readUnsignedShortBE();
        } else if(opcode >= 30 && opcode < 35) {
            def.options[opcode - 30] = buffer.readNewString();
            if(def.options[opcode - 30] === 'Hidden') {
                def.options[-30 + opcode] = null;
            }
        } else if(opcode == 40) {
            // Model color replacement
            const length = buffer.readUnsignedByte();
            for(let i = 0; i < length; i++) {
                buffer.readUnsignedShortBE();
                buffer.readUnsignedShortBE();
            }
        } else if(opcode == 60) {
            const length = buffer.readUnsignedByte();
            def.headModels = new Array(length);
            for(let i = 0; length > i; i++) {
                def.headModels[i] = buffer.readUnsignedShortBE();
            }
        } else if(opcode == 93) {
            def.minimapVisible = false;
        } else if(opcode == 95) {
            def.combatLevel = buffer.readUnsignedShortBE();
        } else if(opcode == 97) {
            def.sizeX = buffer.readUnsignedShortBE();
        } else if(opcode == 98) {
            def.sizeY = buffer.readUnsignedShortBE();
        } else if(opcode == 99) {
            def.renderPriority = true;
        } else if(opcode == 100) {
            const ambient = buffer.readByte();
        } else if(opcode == 101) {
            const contrast = (buffer.readByte()) * 5;
        } else if(opcode == 102) {
            def.headIcon = (buffer.readUnsignedShortBE());
        } else if(opcode == 103) {
            def.turnDegrees = (buffer.readUnsignedShortBE());
        } else if(opcode == 106) {
            let varBitId = buffer.readUnsignedShortBE();
            let settingId = buffer.readUnsignedShortBE();
            if(varBitId == 65535) varBitId = -1;
            if(settingId == 65535) settingId = -1;
            const childCount = buffer.readUnsignedByte();
            for(let i = 0; childCount >= i; i++) {
                buffer.readUnsignedShortBE(); // child id
            }
        } else if(opcode == 107) {
            def.clickable = false;
        }
    }

    return def;
}

export function parseNpcDefinitions(archive: Archive): Map<number, NpcDefinition> {
    const npcDefinitions = new Map<number, NpcDefinition>();

    for(let i = 0; i < archive.files.size; i++) {
        const entry = archive.files.get(i).content;
        npcDefinitions.set(i, decodeNpcDefinition(i, entry));
    }

    return npcDefinitions;
}
