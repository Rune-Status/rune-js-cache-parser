import { EarlyCacheArchive } from '../early-cache-archive';
import { RgbImage } from './rgb-image';

export interface Widget {
    widgetId: number;
    parentId: number;
    type: number;
    actionType: number;
    contentType: number;
    width: number;
    height: number;
    alpha: number;
    hoveredPopup: number;
    conditionCount: number;
    conditionTypes: number[];
    conditionValues: number[];
    cs1length: number;
    cs1opcodes: number[][];
    scrollLimit: number;
    hiddenUntilHovered: boolean;
    children: number[];
    childrenX: number[];
    childrenY: number[];
    unknownOne: number;
    unknownTwo: boolean;
    items: number[];
    itemAmounts: number[];
    itemSwapable: boolean;
    isInventory: boolean;
    itemUsable: boolean;
    itemDeletesDraged: boolean;
    itemSpritePadsX: number;
    itemSpritePadsY: number;
    imageX: number[];
    imageY: number[];
    options: string[];
    images: RgbImage[];
    filled: boolean;
    typeFaceCentered: boolean;
    typeFace: number;
    typeFaceShadowed: boolean;
    disabledText: string;
    enabledText: string;
    disabledColor: number;
    enabledColor: number;
    disabledHoveredColor: number;
    enabledHoveredColor: number;
    disabledImage: RgbImage;
    enabledImage: RgbImage;
    modelType: number;
    modelId: number;
    enabledModelType: number;
    enabledModelId: number;
    disabledAnimation: number;
    enabledAnimation: number;
    zoom: number;
    rotationX: number;
    rotationY: number;
    optionCircumfix: string;
    optionText: string;
    optionAttributes: number;
    tooltip: string;
}

export function parseWidgets(widgetArchive: EarlyCacheArchive, mediaArchive: EarlyCacheArchive): Map<number, Widget> {
    const buffer = widgetArchive.getFileData('data');
    const widgetCount = buffer.readUnsignedShortBE();
    const widgets: Map<number, Widget> = new Map<number, Widget>();
    let parentId: number = -1;

    while(buffer.getReaderIndex() < buffer.getBuffer().length) {
        let widgetId = buffer.readUnsignedShortBE();
        if(widgetId === 65535) {
            parentId = buffer.readUnsignedShortBE();
            widgetId = buffer.readUnsignedShortBE();
        }

        const type = buffer.readUnsignedByte();
        const actionType = buffer.readUnsignedByte();
        const contentType = buffer.readUnsignedShortBE();
        const width = buffer.readUnsignedShortBE();
        const height = buffer.readUnsignedShortBE();
        const alpha = buffer.readUnsignedByte();
        let hoveredPopup = buffer.readUnsignedByte();
        let conditionCount: number;
        let conditionTypes: number[];
        let conditionValues: number[];
        let cs1length: number;
        let cs1opcodes: number[][];
        let scrollLimit: number;
        let hiddenUntilHovered: boolean;
        let children: number[];
        let childrenX: number[];
        let childrenY: number[];
        let unknownOne: number;
        let unknownTwo: boolean;
        let items: number[];
        let itemAmounts: number[];
        let itemSwapable: boolean;
        let isInventory: boolean;
        let itemUsable: boolean;
        let itemDeletesDraged: boolean;
        let itemSpritePadsX: number;
        let itemSpritePadsY: number;
        let imageX: number[];
        let imageY: number[];
        let options: string[];
        let images: RgbImage[];
        let filled: boolean;
        let typeFaceCentered: boolean;
        let typeFace: number;
        let typeFaceShadowed: boolean;
        let disabledText: string;
        let enabledText: string;
        let disabledColor: number;
        let enabledColor: number;
        let disabledHoveredColor: number;
        let enabledHoveredColor: number;
        let disabledImage: RgbImage;
        let enabledImage: RgbImage;
        let modelType: number;
        let modelId: number;
        let enabledModelType: number;
        let enabledModelId: number;
        let disabledAnimation: number;
        let enabledAnimation: number;
        let zoom: number;
        let rotationX: number;
        let rotationY: number;
        let optionCircumfix: string;
        let optionText: string;
        let optionAttributes: number;
        let tooltip: string;

        if(hoveredPopup != 0) {
            hoveredPopup = (hoveredPopup - 1 << 8) + buffer.readUnsignedByte();
        } else {
            hoveredPopup = -1;
        }
        
        if(contentType == 600) {
            const anInt246 = parentId;
        } else if(contentType == 650) {
            const anInt255 = parentId;
        } else if(contentType == 655) {
            const anInt277 = parentId;
        }
        
        conditionCount = buffer.readUnsignedByte();

        if(conditionCount > 0) {
            conditionTypes = new Array(conditionCount);
            conditionValues = new Array(conditionCount);
            for(let condition = 0; condition < conditionCount; condition++) {
                conditionTypes[condition] = buffer.readUnsignedByte();
                conditionValues[condition] = buffer.readUnsignedShortBE();
            }
        }

        cs1length = buffer.readUnsignedByte();
        if(cs1length > 0) {
            cs1opcodes = new Array(cs1length);
            for(let blockIdx = 0; blockIdx < cs1length; blockIdx++) {
                let cs1blocklen = buffer.readUnsignedShortBE();
                cs1opcodes[blockIdx] = new Array(cs1blocklen);
                for(let cs1opcIdx = 0; cs1opcIdx < cs1blocklen; cs1opcIdx++) {
                    cs1opcodes[blockIdx][cs1opcIdx] = buffer.readUnsignedShortBE();
                }
            }
        }

        if(type == 0) {
            scrollLimit = buffer.readUnsignedShortBE();
            hiddenUntilHovered = buffer.readUnsignedByte() == 1;
            let childrenCount = buffer.readUnsignedShortBE();
            children = new Array(childrenCount);
            childrenX = new Array(childrenCount);
            childrenY = new Array(childrenCount);
            for (let child = 0; child < childrenCount; child++) {
                children[child] = buffer.readUnsignedShortBE();
                childrenX[child] = buffer.readShortBE();
                childrenY[child] = buffer.readShortBE();
            }
        }

        if(type == 1) {
            unknownOne = buffer.readUnsignedShortBE();
            unknownTwo = buffer.readUnsignedByte() == 1;
        }

        if(type == 2) {
            items = new Array(width * height);
            itemAmounts = new Array(width * height);
            itemSwapable = buffer.readUnsignedByte() == 1;
            isInventory = buffer.readUnsignedByte() == 1;
            itemUsable = buffer.readUnsignedByte() == 1;
            itemDeletesDraged = buffer.readUnsignedByte() == 1;
            itemSpritePadsX = buffer.readUnsignedByte();
            itemSpritePadsY = buffer.readUnsignedByte();
            imageX = new Array(20);
            imageY = new Array(20);
            images = new Array(20);
            for(let sprite = 0; sprite < 20; sprite++) {
                const hasSprite = buffer.readUnsignedByte();
                if(hasSprite == 1) {
                    imageX[sprite] = buffer.readShortBE();
                    imageY[sprite] = buffer.readShortBE();
                    const spriteName = buffer.readString();
                    if(spriteName.length > 0) {
                        const spriteId = spriteName.lastIndexOf(',');
                        const archiveIndex = parseInt(spriteName.substring(spriteId + 1));
                        const name = spriteName.substring(0, spriteId);
                        images[sprite] = RgbImage.load(mediaArchive, name, archiveIndex);
                    }
                }
            }

            options = new Array(5);
            for(let optionId = 0; optionId < 5; optionId++) {
                options[optionId] = buffer.readString();
                if(options[optionId].length == 0) {
                    options[optionId] = null;
                }
            }
        }

        if(type == 3) {
            filled = buffer.readUnsignedByte() == 1;
        }

        if (type == 4 || type == 1) {
            typeFaceCentered = buffer.readUnsignedByte() == 1;
            typeFace = buffer.readUnsignedByte();
            typeFaceShadowed = buffer.readUnsignedByte() == 1;
        }

        if(type == 4) {
            disabledText = buffer.readString();
            enabledText = buffer.readString();
        }

        if(type == 1 || type == 3 || type == 4) {
            disabledColor = buffer.readIntBE();
        }

        if(type == 3 || type == 4) {
            enabledColor = buffer.readIntBE();
            disabledHoveredColor = buffer.readIntBE();
            enabledHoveredColor = buffer.readIntBE();
        }

        if(type == 5) {
            let spriteName = buffer.readString();
            if(spriteName.length > 0) {
                const spriteId = spriteName.lastIndexOf(',');
                const archiveIndex = parseInt(spriteName.substring(spriteId + 1));
                const name = spriteName.substring(0, spriteId);
                disabledImage = RgbImage.load(mediaArchive, name, archiveIndex);
            }

            spriteName = buffer.readString();
            if(spriteName.length > 0) {
                const spriteId = spriteName.lastIndexOf(',');
                const archiveIndex = parseInt(spriteName.substring(spriteId + 1));
                const name = spriteName.substring(0, spriteId);
                enabledImage = RgbImage.load(mediaArchive, name, archiveIndex);
            }
        }

        if(type == 6) {
            let widgetIndex = buffer.readUnsignedByte();
            if(widgetIndex != 0) {
                modelType = 1;
                modelId = (widgetIndex - 1 << 8) + buffer.readUnsignedByte();
            }
            widgetIndex = buffer.readUnsignedByte();
            if(widgetIndex != 0) {
                enabledModelType = 1;
                enabledModelId = (widgetIndex - 1 << 8) + buffer.readUnsignedByte();
            }
            widgetIndex = buffer.readUnsignedByte();
            if(widgetIndex != 0) {
                disabledAnimation = (widgetIndex - 1 << 8) + buffer.readUnsignedByte();
            } else {
                disabledAnimation = -1;
            }
            widgetIndex = buffer.readUnsignedByte();
            if(widgetIndex != 0) {
                enabledAnimation = (widgetIndex - 1 << 8) + buffer.readUnsignedByte();
            } else {
                enabledAnimation = -1;
            }
            zoom = buffer.readUnsignedShortBE();
            rotationX = buffer.readUnsignedShortBE();
            rotationY = buffer.readUnsignedShortBE();
        }

        if(type == 7) {
            items = new Array(width * height);
            itemAmounts = new Array(width * height);
            typeFaceCentered = buffer.readUnsignedByte() == 1;
            const typeFaceCount = buffer.readUnsignedByte();
            typeFaceShadowed = buffer.readUnsignedByte() == 1;
            disabledColor = buffer.readIntBE();
            itemSpritePadsX = buffer.readShortBE();
            itemSpritePadsY = buffer.readShortBE();
            isInventory = buffer.readUnsignedByte() == 1;
            options = new Array(5);
            for(let optionId = 0; optionId < 5; optionId++) {
                options[optionId] = buffer.readString();
                if(options[optionId].length == 0) {
                    options[optionId] = null;
                }
            }
        }

        if(type == 8) {
            disabledText = buffer.readString();
        }

        if(actionType == 2 || type == 2) {
            optionCircumfix = buffer.readString();
            optionText = buffer.readString();
            optionAttributes = buffer.readUnsignedShortBE();
        }

        if(actionType == 1 || actionType == 4 || actionType == 5 || actionType == 6) {
            tooltip = buffer.readString();
            if(tooltip.length == 0) {
                if (actionType == 1) {
                    tooltip = 'Ok';
                } else if(actionType == 4) {
                    tooltip = 'Select';
                } else if(actionType == 5) {
                    tooltip = 'Select';
                } else if(actionType == 6) {
                    tooltip = 'Continue';
                }
            }
        }

        widgets.set(widgetId, {
            widgetId,
            parentId,
            type,
            actionType,
            contentType,
            width,
            height,
            alpha,
            hoveredPopup,
            conditionCount,
            conditionTypes,
            conditionValues,
            cs1length,
            cs1opcodes,
            scrollLimit,
            hiddenUntilHovered,
            children,
            childrenX,
            childrenY,
            unknownOne,
            unknownTwo,
            items,
            itemAmounts,
            itemSwapable,
            isInventory,
            itemUsable,
            itemDeletesDraged,
            itemSpritePadsX,
            itemSpritePadsY,
            imageX,
            imageY,
            options,
            images,
            filled,
            typeFaceCentered,
            typeFace,
            typeFaceShadowed,
            disabledText,
            enabledText,
            disabledColor,
            enabledColor,
            disabledHoveredColor,
            enabledHoveredColor,
            disabledImage,
            enabledImage,
            modelType,
            modelId,
            enabledModelType,
            enabledModelId,
            disabledAnimation,
            enabledAnimation,
            zoom,
            rotationX,
            rotationY,
            optionCircumfix,
            optionText,
            optionAttributes,
            tooltip,
        });
    }

    return widgets;
}
