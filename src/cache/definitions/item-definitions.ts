import { JagexFile } from '../jagex-file';
import { IndexType } from '../index';
import { Cache } from '../cache';
import { logger } from '@runejs/logger/dist/logger';

export class ItemDefinition {
    id: number;
    name: string;
    stackable: boolean;
    value: number;
    members: boolean;
    groundOptions: string[] = [ null, null, 'Take', null, null ];
    inventoryOptions: string[] = [ null, null, null, null, 'Drop' ];
    teamIndex: number;
    inventoryModelId: number;
    modelZoom: number;
    modelRotation1: number;
    modelRotation2: number;
    modelOffset1: number;
    modelOffset2: number;
    originalModelColors: number[];
    modifiedModelColors: number[];
    notedId: number;
    noteTemplateId: number;
    stackableIds: number[];
    stackableAmounts: number[];
}

function decodeItem(id: number, file: JagexFile): ItemDefinition {
    const buffer = file.content;
    const def = new ItemDefinition();
    def.id = id;

    while(true) {
        const opcode = buffer.get('BYTE', 'UNSIGNED');
        if(opcode == 0) {
            break;
        }

        if(opcode == 1) {
            def.inventoryModelId = buffer.get('SHORT', 'UNSIGNED');
        } else if(opcode == 2) {
            def.name = buffer.getString();
        } else if(opcode == 4) {
            def.modelZoom = buffer.get('SHORT', 'UNSIGNED');
        } else if(opcode == 5) {
            def.modelRotation1 = buffer.get('SHORT', 'UNSIGNED');
        } else if(opcode == 6) {
            def.modelRotation2 = buffer.get('SHORT', 'UNSIGNED');
        } else if(opcode == 7) {
            def.modelOffset1 = buffer.get('SHORT', 'UNSIGNED');
            if(def.modelOffset1 > 32767) {
                def.modelOffset1 -= 65536;
            }
        } else if(opcode == 8) {
            def.modelOffset2 = buffer.get('SHORT', 'UNSIGNED');
            if(def.modelOffset2 > 32767) {
                def.modelOffset2 -= 65536;
            }
        } else if(opcode == 11) {
            def.stackable = true;
        } else if(opcode == 12) {
            def.value = buffer.get('INT');
        } else if(opcode == 16) {
            def.members = true;
        } else if(opcode == 23) {
            buffer.get('SHORT', 'UNSIGNED');
            buffer.get('BYTE', 'UNSIGNED');
        } else if(opcode == 24) {
            buffer.get('SHORT', 'UNSIGNED');
        } else if(opcode == 25) {
            buffer.get('SHORT', 'UNSIGNED');
            buffer.get('BYTE', 'UNSIGNED');
        } else if(opcode == 26) {
            buffer.get('SHORT', 'UNSIGNED');
        } else if(opcode >= 30 && opcode < 35) {
            def.groundOptions[-30 + opcode] = buffer.getString();
            if(def.groundOptions[opcode + -30] === 'Hidden') {
                def.groundOptions[opcode + -30] = null;
            }
        } else if(opcode >= 35 && opcode < 40) {
            def.inventoryOptions[opcode + -35] = buffer.getString();
        } else if(opcode == 40) {
            const colorCount = buffer.get('BYTE', 'UNSIGNED');
            def.originalModelColors = new Array(colorCount);
            def.modifiedModelColors = new Array(colorCount);
            for(let colorIndex = 0; colorIndex < colorCount; colorIndex++) {
                def.modifiedModelColors[colorIndex] = buffer.get('SHORT', 'UNSIGNED');
                def.originalModelColors[colorIndex] = buffer.get('SHORT', 'UNSIGNED');
            }
        } else if(opcode == 78) {
            buffer.get('SHORT', 'UNSIGNED');
        } else if(opcode == 79) {
            buffer.get('SHORT', 'UNSIGNED');
        } else if(opcode == 90) {
            buffer.get('SHORT', 'UNSIGNED');
        } else if(opcode == 91) {
            buffer.get('SHORT', 'UNSIGNED');
        } else if(opcode == 92) {
            buffer.get('SHORT', 'UNSIGNED');
        } else if(opcode == 93) {
            buffer.get('SHORT', 'UNSIGNED');
        } else if(opcode == 95) {
            buffer.get('SHORT', 'UNSIGNED');
        } else if(opcode == 97) {
            def.notedId = (buffer.get('SHORT', 'UNSIGNED'));
        } else if(opcode == 98) {
            def.noteTemplateId = (buffer.get('SHORT', 'UNSIGNED'));
        } else if(opcode >= 100 && opcode < 110) {
            if(def.stackableIds == null) {
                def.stackableAmounts = new Array(10);
                def.stackableIds = new Array(10);
            }
            def.stackableIds[-100 + opcode] = (buffer.get('SHORT', 'UNSIGNED'));
            def.stackableAmounts[-100 + opcode] = (buffer.get('SHORT', 'UNSIGNED'));
        } else if(opcode == 110) {
            (buffer.get('SHORT', 'UNSIGNED'));
        } else if(opcode == 111) {
            (buffer.get('SHORT', 'UNSIGNED'));
        } else if(opcode == 112) {
            (buffer.get('SHORT', 'UNSIGNED'));
        } else if(opcode == 113) {
            (buffer.get('BYTE'));
        } else if(opcode == 114) {
            const i = ((buffer.get('BYTE')) * 5);
        } else if(opcode == 115) {
            def.teamIndex = buffer.get('BYTE', 'UNSIGNED');
        }
    }
    
    return def;
}

/**
 * Parses the game item definition archive.
 * @param cache The game cache instance.
 */
export function decodeItemDefinitions(cache: Cache): Map<number, ItemDefinition> {
    const archive = cache.getArchive(IndexType.DEFINITIONS, 10);
    const items = new Map<number, ItemDefinition>();

    for(let i = 0; i < archive.files.size; i++) {
        const itemFile = archive.files.get(i);
        items.set(i, decodeItem(i, itemFile));
    }

    logger.info(`Decoded ${items.size} item definitions.`);

    return items;
}
