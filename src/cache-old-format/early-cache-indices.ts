import { EarlyCacheArchive } from './early-cache-archive';
import { RsBuffer } from '../net/rs-buffer';
import { logger } from '@runejs/logger';

export interface EarlyDefinitionIndex {
    id: number;
    offset: number;
}

export interface MapRegionIndex {
    id: number;
    mapRegionFileId: number;
    landscapeFileId: number;
    members: boolean;
}

export class EarlyCacheIndices {

    private _itemDefinitionIndices: EarlyDefinitionIndex[];
    private _npcDefinitionIndices: EarlyDefinitionIndex[];
    private _landscapeObjectDefinitionIndices: EarlyDefinitionIndex[];
    private _mapRegionIndices: MapRegionIndex[];

    public constructor(private readonly definitionArchive: EarlyCacheArchive, private readonly versionListArchive: EarlyCacheArchive,
                       loadDefinitions: boolean, loadMaps: boolean) {
        if(loadDefinitions) {
            this.parseItemDefinitionIndices();
            this.parseNpcDefinitionIndices();
            this.parseLandscapeObjectDefinitionIndices();
        }

        if(loadMaps) {
            this.parseMapRegionIndices();
        }
    }

    private parseLandscapeObjectDefinitionIndices(): void {
        logger.info('Parsing early-cache landscape object definition indices...');

        this._landscapeObjectDefinitionIndices = this.parseDefinitionIndices('loc.idx');

        logger.info(`${this._landscapeObjectDefinitionIndices.length} landscape objects found within the game cache.`);
    }

    private parseNpcDefinitionIndices(): void {
        logger.info('Parsing early-cache npc definition indices...');

        this._npcDefinitionIndices = this.parseDefinitionIndices('npc.idx');

        logger.info(`${this._npcDefinitionIndices.length} npcs found within the game cache.`);
    }

    private parseItemDefinitionIndices(): void {
        logger.info('Parsing early-cache item definition indices...');

        this._itemDefinitionIndices = this.parseDefinitionIndices('obj.idx');

        logger.info(`${this._itemDefinitionIndices.length} items found within the game cache.`);
    }

    private parseDefinitionIndices(fileName: string): EarlyDefinitionIndex[] {
        const buffer: RsBuffer = this.definitionArchive.getFileData(fileName);
        const indexCount = buffer.readUnsignedShortBE();
        const indices: EarlyDefinitionIndex[] = new Array(indexCount);
        let offset = 2;

        for(let id = 0; id < indexCount; id++) {
            indices[id] = { id, offset };
            offset += buffer.readUnsignedShortBE();
        }

        return indices;
    }

    private parseMapRegionIndices(): void {
        logger.info('Parsing early-cache map region indices...');

        const buffer: RsBuffer = this.versionListArchive.getFileData('map_index');
        const indexCount = Math.floor(buffer.getBuffer().length / 7);
        const indices: MapRegionIndex[] = new Array(indexCount);

        for(let i = 0; i < indexCount; i++) {
            const id = buffer.readUnsignedShortBE();
            const mapRegionFileId = buffer.readUnsignedShortBE();
            const landscapeFileId = buffer.readUnsignedShortBE();
            const members = buffer.readUnsignedByte() === 1;
            indices[i] = { id, mapRegionFileId, landscapeFileId, members };
        }

        this._mapRegionIndices = indices;

        logger.info(`${indexCount} map regions found within the game cache.`);
    }

    public get itemDefinitionIndices(): EarlyDefinitionIndex[] {
        return this._itemDefinitionIndices;
    }

    public get npcDefinitionIndices(): EarlyDefinitionIndex[] {
        return this._npcDefinitionIndices;
    }

    public get landscapeObjectDefinitionIndices(): EarlyDefinitionIndex[] {
        return this._landscapeObjectDefinitionIndices;
    }

    public get mapRegionIndices(): MapRegionIndex[] {
        return this._mapRegionIndices;
    }
}
