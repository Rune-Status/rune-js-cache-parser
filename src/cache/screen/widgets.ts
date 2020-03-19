import { Cache } from '../cache';
import { IndexType } from '../index';
import { logger } from '@runejs/logger/dist/logger';
import { Archive } from '../archive';
import { JagexFile } from '../jagex-file';
import { ByteBuffer } from '../../net/byte-buffer';

export class WidgetChild {
    id: number;
    parentId?: number;
    hoveredSiblingId?: number;
    isIf3: boolean;
    type: number;
    menuType?: number;
    contentType?: number;
    originalX?: number;
    originalY?: number;
    x?: number;
    y?: number;
    originalWidth?: number;
    originalHeight?: number;
    opacity?: number;
    alternateOperators?: number[];
    alternateRhs?: number[];
    clientScripts?: number[][];
    scrollHeight?: number;
    isHidden?: boolean;
    items?: number[];
    itemAmounts?: number[];
    itemSwapable?: boolean;
    isInventory?: boolean;
    itemUsable?: boolean;
    itemDeletesDraged?: boolean;
    itemSpritePadsX?: number;
    itemSpritePadsY?: number;
    imageX?: number[];
    imageY?: number[];
    images?: number[];
    options?: string[];
    filled?: boolean;
    xTextAlignment?: number;
    yTextAlignment?: number;
    lineHeight?: number;
    fontId?: number;
    textShadowed?: boolean;
    text?: string;
    alternateText?: string;
    textColor?: number;
    alternateTextColor?: number;
    hoveredTextColor?: number;
    alternateHoveredTextColor?: number;
    spriteId?: number;
    alternateSpriteId?: number;
    modelType?: number;
    modelId?: number;
    alternateModelType?: number;
    alternateModelId?: number;
    animation?: number;
    alternateAnimation?: number;
    modelZoom?: number;
    rotationX?: number;
    rotationZ?: number;
    rotationY?: number;
    offsetX2d?: number;
    offsetY2d?: number;
    orthogonal?: boolean;
    targetVerb?: string;
    spellName?: string;
    clickMask?: number;
    tooltip?: string;
    scrollPosition?: number;
    
    // Unknowns
    aBoolean2688?: boolean;
    aBoolean2641?: boolean;
    anInt2746?: number;
    anInt2751?: number;
}

export class Widget {
    id: number;
    crc: number;
    version: number;
    children: WidgetChild[] = null;
}

function decodeIf1(id: number, file: JagexFile | ByteBuffer): WidgetChild {
    let buffer: ByteBuffer;

    if(file instanceof JagexFile) {
        buffer = file.content;
    } else {
        buffer = file;
    }

    const child = new WidgetChild();

    child.id = id;
    child.isIf3 = false;
    child.type = buffer.get('BYTE', 'UNSIGNED');
    child.menuType = buffer.get('BYTE', 'UNSIGNED');
    child.contentType = buffer.get('SHORT', 'UNSIGNED');
    child.originalX = buffer.get('SHORT');
    child.x = child.originalX;
    child.originalY = buffer.get('SHORT');
    child.y = child.originalY;
    child.originalWidth = buffer.get('SHORT', 'UNSIGNED');
    child.originalHeight = buffer.get('SHORT', 'UNSIGNED');
    child.opacity = buffer.get('BYTE', 'UNSIGNED');
    child.parentId = buffer.get('SHORT', 'UNSIGNED');
    if(child.parentId == 0xFFFF) {
        child.parentId = -1;
    }
    child.hoveredSiblingId = buffer.get('SHORT', 'UNSIGNED');
    if(child.hoveredSiblingId == 0xFFFF) {
        child.hoveredSiblingId = -1;
    }

    const alternateCount = buffer.get('BYTE', 'UNSIGNED');
    if(alternateCount > 0) {
        child.alternateOperators = new Array(alternateCount);
        child.alternateRhs = new Array(alternateCount);
        for(let i = 0; alternateCount > i; i++) {
            child.alternateOperators[i] = buffer.get('BYTE', 'UNSIGNED');
            child.alternateRhs[i] = buffer.get('SHORT', 'UNSIGNED');
        }
    }
    
    const clientScriptCount = buffer.get('BYTE', 'UNSIGNED');
    if(clientScriptCount > 0) {
        child.clientScripts = new Array(clientScriptCount);
        
        for(let i = 0; (i < clientScriptCount); i++) {
            const k = buffer.get('SHORT', 'UNSIGNED');
            child.clientScripts[i] = new Array(k);
            
            for(let j = 0; (k > j); j++) {
                child.clientScripts[i][j] = buffer.get('SHORT', 'UNSIGNED');
                if(child.clientScripts[i][j] == 65535) {
                    child.clientScripts[i][j] = -1;
                }
            }
        }
    }

    if(child.type == 0) {
        child.scrollHeight = buffer.get('SHORT', 'UNSIGNED');
        child.isHidden = buffer.get('BYTE', 'UNSIGNED') == 1;
    }
    
    if(child.type == 1) {
        buffer.get('SHORT', 'UNSIGNED');
        buffer.get('BYTE', 'UNSIGNED');
    }

    if(child.type == 2) {
        child.items = new Array(child.originalHeight * child.originalWidth);
        child.itemAmounts = new Array(child.originalHeight * child.originalWidth);
        child.itemSwapable = buffer.get('BYTE', 'UNSIGNED')== 1;
        child.isInventory = buffer.get('BYTE', 'UNSIGNED') == 1;
        child.itemUsable = buffer.get('BYTE', 'UNSIGNED') == 1;
        child.itemDeletesDraged = buffer.get('BYTE', 'UNSIGNED') == 1;
        child.itemSpritePadsX = buffer.get('BYTE', 'UNSIGNED');
        child.itemSpritePadsY = buffer.get('BYTE', 'UNSIGNED');
        child.imageX = new Array(20);
        child.imageY = new Array(20);
        child.images = new Array(20);
        for(let sprite = 0; sprite < 20; sprite++) {
            const hasSprite = buffer.get('BYTE', 'UNSIGNED');
            if(hasSprite == 1) {
                child.images[sprite] = buffer.get('SHORT');
                child.imageX[sprite] = buffer.get('SHORT');
                child.imageY[sprite] = buffer.get('INT');
            } else {
                child.imageY[sprite] = -1;
            }
        }
        
        child.options = new Array(5);
        for(let i = 0; i < 5; i++) {
            child.options[i] = buffer.getString();
            if(child.options[i].length == 0) {
                child.options[i] = null;
            }
        }
    }

    if(child.type == 3) {
        child.filled = buffer.get('BYTE', 'UNSIGNED') == 1;
    }
    
    if(child.type == 4 || child.type == 1) {
        child.xTextAlignment = buffer.get('BYTE', 'UNSIGNED');
        child.yTextAlignment = buffer.get('BYTE', 'UNSIGNED');
        child.lineHeight = buffer.get('BYTE', 'UNSIGNED');
        child.fontId = buffer.get('SHORT', 'UNSIGNED');
        child.textShadowed = buffer.get('BYTE', 'UNSIGNED') == 1;
    }
    
    if(child.type == 4) {
        child.text = buffer.getString();
        child.alternateText = buffer.getString();
    }

    if(child.type == 1 || child.type == 3 || child.type == 4) {
        child.textColor = buffer.get('INT');
    }
    
    if(child.type == 3 || child.type == 4) {
        child.alternateTextColor = buffer.get('INT');
        child.hoveredTextColor = buffer.get('INT');
        child.alternateHoveredTextColor = buffer.get('INT');
    }
    
    if(child.type == 5) {
        child.spriteId = buffer.get('INT');
        child.alternateSpriteId = buffer.get('INT');
    }

    if(child.type == 6) {
        child.modelType = 1;
        child.modelId = buffer.get('SHORT', 'UNSIGNED');
        if(child.modelId == 0xFFFF) {
            child.modelId = -1;
        }
        child.alternateModelType = 1;
        child.alternateModelId = buffer.get('SHORT', 'UNSIGNED');
        if(child.alternateModelId == 0xFFFF) {
            child.alternateModelId = -1;
        }
        child.animation = buffer.get('SHORT', 'UNSIGNED');
        if(child.animation == 0xFFFF) {
            child.animation = -1;
        }
        child.alternateAnimation = buffer.get('SHORT', 'UNSIGNED');
        if(child.alternateAnimation == 0xFFFF) {
            child.alternateAnimation = -1;
        }
        child.modelZoom = buffer.get('SHORT', 'UNSIGNED');
        child.rotationX = buffer.get('SHORT', 'UNSIGNED');
        child.rotationY = buffer.get('SHORT', 'UNSIGNED');
    }

    if(child.type == 7) {
        child.items = new Array(child.originalWidth * child.originalHeight);
        child.itemAmounts = new Array(child.originalWidth * child.originalHeight);
        child.xTextAlignment = buffer.get('BYTE', 'UNSIGNED');
        child.fontId = buffer.get('SHORT', 'UNSIGNED');
        child.textShadowed = buffer.get('BYTE', 'UNSIGNED') == 1;
        child.textColor = buffer.get('INT');
        child.itemSpritePadsX = buffer.get('SHORT');
        child.itemSpritePadsY = buffer.get('SHORT');
        child.isInventory = buffer.get('BYTE', 'UNSIGNED') == 1;
        child.options = new Array(5);

        for(let i = 0; i < 5; i++) {
            child.options[i] = buffer.getString();
            if(child.options[i].length == 0) {
                child.options[i] = null;
            }
        }
    }

    if(child.type == 8) {
        child.text = buffer.getString();
    }

    if(child.menuType == 2 || child.type == 2) {
        child.targetVerb = buffer.getString();
        child.spellName = buffer.getString();
        child.clickMask = buffer.get('SHORT', 'UNSIGNED');
    }

    if(child.menuType == 1 || child.menuType == 4 || child.menuType == 5 || child.menuType == 6) {
        child.tooltip = buffer.getString();
        if(child.tooltip.length == 0) {
            if(child.menuType == 1) {
                child.tooltip = 'Ok';
            } else if(child.menuType == 4 || child.menuType == 5) {
                child.tooltip = 'Select';
            } else if(child.menuType == 6) {
                child.tooltip = 'Continue';
            }
        }
    }

    return child;
}

function decodeIf3(id: number, file: JagexFile | ByteBuffer): WidgetChild {
    let buffer;

    if(file instanceof JagexFile) {
        buffer = file.content;
    } else {
        buffer = file;
    }

    const child = new WidgetChild();
    
    child.id = id;
    child.isIf3 = true;
    child.type = buffer.get('BYTE', 'UNSIGNED');
    child.contentType = buffer.get('SHORT', 'UNSIGNED');
    child.originalX = buffer.get('SHORT');
    child.x = child.originalX;
    child.originalY = buffer.get('SHORT');
    child.y = child.originalY;
    child.originalWidth = buffer.get('SHORT', 'UNSIGNED');
    
    if(child.type == 9) {
        child.originalHeight = buffer.get('SHORT');
    } else {
        child.originalHeight = buffer.get('SHORT', 'UNSIGNED');
    }
    
    child.parentId = buffer.get('SHORT', 'UNSIGNED');
    if(child.parentId == 0xFFFF) {
        child.parentId = -1;
    }
    
    child.isHidden = buffer.get('BYTE', 'UNSIGNED') == 1;
    child.aBoolean2688 = buffer.get('BYTE', 'UNSIGNED') == 1;
    
    if(child.type == 0) {
        child.anInt2746 = buffer.get('SHORT', 'UNSIGNED');
        child.scrollPosition = buffer.get('SHORT', 'UNSIGNED');
    }
    
    if(child.type == 5) {
        child.spriteId = buffer.readIntBE();
        child.anInt2751 = buffer.get('SHORT', 'UNSIGNED');
        child.aBoolean2641 = buffer.get('BYTE', 'UNSIGNED') == 1;
        child.opacity = buffer.get('BYTE', 'UNSIGNED');
    }

    if(child.type == 6) {
        child.modelType = 1;
        child.modelId = buffer.get('SHORT', 'UNSIGNED');
        if(child.modelId == 65535) {
            child.modelId = -1;
        }
        child.offsetX2d = buffer.get('SHORT');
        child.offsetY2d = buffer.get('SHORT');
        child.rotationX = buffer.get('SHORT', 'UNSIGNED');
        child.rotationZ = buffer.get('SHORT', 'UNSIGNED');
        child.rotationY = buffer.get('SHORT', 'UNSIGNED');
        child.modelZoom = buffer.get('SHORT', 'UNSIGNED');
        child.animation = buffer.get('SHORT', 'UNSIGNED');
        if(child.animation == 65535) {
            child.animation = -1;
        }
        child.orthogonal = buffer.get('BYTE', 'UNSIGNED') == 1;
    }

    if(child.type == 4) {
        child.fontId = buffer.get('SHORT', 'UNSIGNED');
        child.text = buffer.readNewString();
        child.lineHeight = buffer.get('BYTE', 'UNSIGNED');
        child.xTextAlignment = buffer.get('BYTE', 'UNSIGNED');
        child.yTextAlignment = buffer.get('BYTE', 'UNSIGNED');
        child.textShadowed = buffer.get('BYTE', 'UNSIGNED') == 1;
        child.textColor = buffer.readIntBE();
    }
    
    if(child.type == 3) {
        child.textColor = buffer.readIntBE();
        child.filled = buffer.get('BYTE', 'UNSIGNED') == 1;
        child.opacity = buffer.get('BYTE', 'UNSIGNED');
    }
    
    if(child.type == 9) {
        buffer.get('BYTE', 'UNSIGNED');
        child.textColor = buffer.readIntBE();
    }

    // @TODO cs2 support

    return child;
}

/**
 * Parses a single widget file (a widget that contains a single child)
 * @param id The ID of the widget.
 * @param crc The CRC value of the widget file.
 * @param version The version number of the widget file.
 * @param file The widget file.
 */
function parseWidgetFile(id: number, crc: number, version: number, file: JagexFile): Widget {
    const buffer = file.content;

    const children = new Array(1);
    if(buffer == null || buffer.length === 0) {
        children[0] = new WidgetChild();
        children[0].id = 0;
    } else {
        const type = buffer[0];
        if(type === -1) {
            children[0] = decodeIf3(0, buffer);
        } else {
            children[0] = decodeIf1(0, buffer);
        }
    }

    return { id, crc, version, children };
}

/**
 * Parses a widget archive, which contains a number of widget child files.
 * @param id The ID of the widget.
 * @param crc The CRC value of the widget archive.
 * @param version The version number of the widget file.
 * @param widgetArchive The widget archive.
 */
function parseWidgetArchive(id: number, crc: number, version: number, widgetArchive: Archive): Widget {
    let children: WidgetChild[] = null;

    if(widgetArchive.files.size > 0) {
        children = new Array(widgetArchive.files.size).fill(null);

        for(let i = 0; i < widgetArchive.files.size; i++) {
            const widgetChildFile: JagexFile = widgetArchive.files[i];
            if(widgetChildFile == null || !widgetChildFile.content || widgetChildFile.content.length === 0) {
                children[i] = new WidgetChild();
                children[i].id = i;
                continue;
            }

            const type = widgetChildFile.content[0];
            if(type === -1) {
                children[i] = decodeIf3(i, widgetChildFile);
            } else {
                children[i] = decodeIf1(i, widgetChildFile);
            }
        }
    }

    return { id, crc, version, children };
}

/**
 * Fetches the widgets from the game cache and parses them.
 * @param cache The game cache instance.
 */
export const decodeWidgets = (cache: Cache): Map<number, Widget> => {
    const index = cache.indices.get(IndexType.WIDGETS);
    const widgets = new Map<number, Widget>();
    const widgetCount = index.archives.size;

    for(let i = 0; i < widgetCount; i++) {
        const widgetFile = cache.getArchive(index, i);
        const entry = index.archives.get(i);
        const crc = entry?.crc || -1;
        const version = entry?.version || 0;

        if(widgetFile.files.size === 1 && widgetFile.files.get(0).content.length === 0) {
            widgetFile.content.readerIndex = 0;
            widgets.set(i, parseWidgetFile(i, crc, version, widgetFile));
        } else {
            widgets.set(i, parseWidgetArchive(i, crc, version, widgetFile));
        }
    }

    logger.info(`Decoded ${widgets.size} widgets.`);

    return widgets;
};
