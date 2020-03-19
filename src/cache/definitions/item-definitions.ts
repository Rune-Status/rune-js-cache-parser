import { RsBuffer } from '../../net/rs-buffer';
import { ItemDefinition, NewFormatItemDefinition } from '../../definitions/item-definition';
import { Archive } from '../archive';

function decodeItemDefinition(id: number, buffer: RsBuffer) {
    const def = new NewFormatItemDefinition();
    def.id = id;

    while(true) {
        const opcode = buffer.readUnsignedByte();
        if(opcode == 0) {
            break;
        }

        if(opcode == 1) {
            def.inventoryModelId = buffer.readUnsignedShortBE();
        } else if(opcode == 2) {
            def.name = buffer.readNewString();
        } else if(opcode == 4) {
            def.modelZoom = buffer.readUnsignedShortBE();
        } else if(opcode == 5) {
            def.modelRotation1 = buffer.readUnsignedShortBE();
        } else if(opcode == 6) {
            def.modelRotation2 = buffer.readUnsignedShortBE();
        } else if(opcode == 7) {
            def.modelOffset1 = buffer.readUnsignedShortBE();
            if(def.modelOffset1 > 32767) {
                def.modelOffset1 -= 65536;
            }
        } else if(opcode == 8) {
            def.modelOffset2 = buffer.readUnsignedShortBE();
            if(def.modelOffset2 > 32767) {
                def.modelOffset2 -= 65536;
            }
        } else if(opcode == 11) {
            def.stackable = true;
        } else if(opcode == 12) {
            def.value = buffer.readIntBE();
        } else if(opcode == 16) {
            def.members = true;
        } else if(opcode == 23) {
            buffer.readUnsignedShortBE();
            buffer.readUnsignedByte();
        } else if(opcode == 24) {
            buffer.readUnsignedShortBE();
        } else if(opcode == 25) {
            buffer.readUnsignedShortBE();
            buffer.readUnsignedByte();
        } else if(opcode == 26) {
            buffer.readUnsignedShortBE();
        } else if(opcode >= 30 && opcode < 35) {
            def.groundOptions[-30 + opcode] = buffer.readNewString();
            if(def.groundOptions[opcode + -30] === 'Hidden') {
                def.groundOptions[opcode + -30] = null;
            }
        } else if(opcode >= 35 && opcode < 40) {
            def.inventoryOptions[opcode + -35] = buffer.readNewString();
        } else if(opcode == 40) {
            const colorCount = buffer.readUnsignedByte();
            def.originalModelColors = new Array(colorCount);
            def.modifiedModelColors = new Array(colorCount);
            for(let colorIndex = 0; colorIndex < colorCount; colorIndex++) {
                def.modifiedModelColors[colorIndex] = buffer.readUnsignedShortBE();
                def.originalModelColors[colorIndex] = buffer.readUnsignedShortBE();
            }
        } else if(opcode == 78) {
            buffer.readUnsignedShortBE();
        } else if(opcode == 79) {
            buffer.readUnsignedShortBE();
        } else if(opcode == 90) {
            buffer.readUnsignedShortBE();
        } else if(opcode == 91) {
            buffer.readUnsignedShortBE();
        } else if(opcode == 92) {
            buffer.readUnsignedShortBE();
        } else if(opcode == 93) {
            buffer.readUnsignedShortBE();
        } else if(opcode == 95) {
            buffer.readUnsignedShortBE();
        } else if(opcode == 97) {
            def.notedId = (buffer.readUnsignedShortBE());
        } else if(opcode == 98) {
            def.noteTemplateId = (buffer.readUnsignedShortBE());
        } else if(opcode >= 100 && opcode < 110) {
            if(def.stackableIds == null) {
                def.stackableAmounts = new Array(10);
                def.stackableIds = new Array(10);
            }
            def.stackableIds[-100 + opcode] = (buffer.readUnsignedShortBE());
            def.stackableAmounts[-100 + opcode] = (buffer.readUnsignedShortBE());
        } else if(opcode == 110) {
            (buffer.readUnsignedShortBE());
        } else if(opcode == 111) {
            (buffer.readUnsignedShortBE());
        } else if(opcode == 112) {
            (buffer.readUnsignedShortBE());
        } else if(opcode == 113) {
            (buffer.readByte());
        } else if(opcode == 114) {
            const i = ((buffer.readByte()) * 5);
        } else if(opcode == 115) {
            def.teamIndex = buffer.readUnsignedByte();
        }
    }
    
    return def;
}

export function parseItemDefinitions(archive: Archive): Map<number, ItemDefinition> {
    const itemDefinitions = new Map<number, ItemDefinition>();

    for(let i = 0; i < archive.files.size; i++) {
        const entry = archive.files.get(i).content;
        itemDefinitions.set(i, decodeItemDefinition(i, entry));
    }

    return itemDefinitions;
}
