import { join } from 'path';
import { readFileSync } from 'fs';
import { RsBuffer } from '../net/rs-buffer';
import { Index } from './index';
import { Archive } from './archive';
import { decompress } from '../util/compression-util';

import { decodeItemDefinitions, ItemDefinition } from './definitions/item-definitions';
import { decodeNpcDefinitions, NpcDefinition } from './definitions/npc-definitions';
import { decodeLocationObjectDefinitions, LocationObjectDefinition } from './definitions/location-object-definitions';
import { decodeWidgets, Widget } from './screen/widgets';
import { decodeSprites, Sprite } from './screen/sprites';
import { decodeRegions, MapData } from './map/regions';
import { logger } from '@runejs/logger/dist/logger';

/**
 * Details about which cache content archives to automatically decode when loading a game cache.
 */
export interface ContentOptions {
    all?: boolean;
    items?: boolean;
    npcs?: boolean;
    locationObjects?: boolean;
    widgets?: boolean;
    sprites?: boolean;
    mapData?: boolean;
}

/**
 * Holds information about the RuneScape game cache.
 */
export class Cache {

    public static readonly INDEX_SIZE = 6;
    public static readonly HEADER_SIZE = 8;
    public static readonly DATA_SIZE = 512;
    public static readonly SECTOR_SIZE = Cache.HEADER_SIZE + Cache.DATA_SIZE;

    public dataChannel: RsBuffer;
    public indexChannels: RsBuffer[];
    public metaChannel: RsBuffer;

    public indices: Map<number, Index> = new Map<number, Index>();

    public itemDefinitions: Map<number, ItemDefinition>;
    public npcDefinitions: Map<number, NpcDefinition>;
    public locationObjectDefinitions: Map<number, LocationObjectDefinition>;
    public widgets: Map<number, Widget>;
    public sprites: Map<string, Sprite>;
    public mapData: MapData;

    public constructor(public cacheDirectory: string, decodeContentArchives?: ContentOptions | boolean) {
        this.createChannels();
        this.decodeIndices();

        if(decodeContentArchives !== undefined) {
            if(typeof decodeContentArchives === 'boolean') {
                decodeContentArchives = { all: decodeContentArchives };
            }

            this.decodeContentArchives(decodeContentArchives);
        }
    }

    /**
     * Decodes the specified content archives.
     * @param options Options pertaining to which content archives to automatically decode.
     */
    public decodeContentArchives(options: ContentOptions): void {
        logger.info(`Decoding content archives...`);

        const decoders = {
            items: [ 'itemDefinitions', decodeItemDefinitions ],
            npcs: [ 'npcDefinitions', decodeNpcDefinitions ],
            locationObjects: [ 'locationObjectDefinitions', decodeLocationObjectDefinitions ],
            widgets: [ 'widgets', decodeWidgets ],
            sprites: [ 'sprites', decodeSprites ],
            mapData: [ 'mapData', decodeRegions ]
        };

        const keys = Object.keys(decoders);
        keys.forEach(type => {
            if(!options[type] && !options.all) {
                return;
            }

            const decoder = decoders[type];
            this[decoder[0]] = decoder[1](this);
        });

        logger.info(`Content archive decoding complete.`);
    }

    private decodeIndices(): void {
        for(let i = 0; i < this.indexChannels.length; i++) {
            const indexData = decompress(this.getRawFile(255, i));
            this.indices.set(i, new Index(this, i, indexData.buffer));
        }
    }

    private createChannels(): void {
        this.dataChannel = new RsBuffer(readFileSync(join(this.cacheDirectory, 'main_file_cache.dat2')));
        this.indexChannels = [];

        for(let i = 0; i < 254; i++) {
            try {
                const index = new RsBuffer(readFileSync(join(this.cacheDirectory, `main_file_cache.idx${i}`)));
                this.indexChannels.push(index);
            } catch(error) {
                break;
            }
        }

        this.metaChannel = new RsBuffer(readFileSync(join(this.cacheDirectory, 'main_file_cache.idx255')));
    }

    /**
     * Fetches a file from the specified index by ID.
     * @param index The cache index to search.
     * @param fileId The ID of the file to search for.
     * @param keys The XTEA keys used to decrypt this file.
     */
    public getFile(index: Index | number, fileId: number, keys?: number[]): Archive {
        if(typeof index === 'number') {
            index = this.indices.get(index);
        }

        const buffer = this.getDecompressedFile(index, fileId, keys);
        if(!buffer) {
            return null;
        }

        const archive = index.archives.get(fileId);

        if(!archive) {
            return null;
        }

        archive.content = buffer;
        return archive;
    }

    /**
     * Fetches an archive from the specified index by ID.
     * @param index The cache index to search.
     * @param fileId The ID of the archive to search for.
     * @param keys The XTEA keys used to decrypt this archive.
     */
    public getArchive(index: Index | number, archiveId: number, keys?: number[]): Archive {
        if(typeof index === 'number') {
            index = this.indices.get(index);
        }

        const buffer = this.getDecompressedFile(index, archiveId, keys);
        if(!buffer) {
            return null;
        }

        const archive = index.archives.get(archiveId);

        if(!archive) {
            return null;
        }

        return archive.decodeFiles(buffer, archive.files.size);
    }

    private getDecompressedFile(index: Index, fileId: number, keys?: number[]): RsBuffer {
        const fileData = this.getRawFile(index.id, fileId);
        if(!fileData || fileData.getBuffer().length < 1) {
            return null;
        }

        const decompressedFile = decompress(fileData, keys);

        if(!decompressedFile) {
            return null;
        }

        return decompressedFile.buffer;
    }

    private decodeFileIndex(buffer: RsBuffer) {
        if(buffer.getReadable() != Cache.INDEX_SIZE) {
            throw new Error('Not Enough Readable Index Data');
        }

        const size = buffer.readMediumBE();
        const sector = buffer.readMediumBE();
        return { size, sector };
    }

    private decodeFileSector(buffer: RsBuffer) {
        if(buffer.getReadable() != Cache.SECTOR_SIZE) {
            throw new Error('Not Enough Readable Sector Data');
        }

        const id = buffer.readUnsignedShortBE();
        const chunk = buffer.readUnsignedShortBE();
        const nextSector = buffer.readMediumBE();
        const type = buffer.readUnsignedByte();
        const data = RsBuffer.create(Cache.DATA_SIZE);
        buffer.getBuffer().copy(data.getBuffer(), 0, buffer.getReaderIndex(), buffer.getReaderIndex() + Cache.DATA_SIZE);

        return { id, chunk, nextSector, type, data };
    }

    /**
     * Fetches raw file or archive data from the specified index.
     * @param index The ID of the index to search.
     * @param fileId The ID of the file or archive to search for.
     */
    public getRawFile(index: number, fileId: number): RsBuffer {
        const indexChannel = index == 255 ? this.metaChannel : this.indexChannels[index];

        let ptr = fileId * Cache.INDEX_SIZE;
        if(ptr < 0 || ptr >= indexChannel.getBuffer().length) {
            throw new Error('File Not Found');
        }

        let buf = RsBuffer.create(Cache.INDEX_SIZE);
        indexChannel.getBuffer().copy(buf.getBuffer(), 0, ptr, ptr + Cache.INDEX_SIZE);

        const fileIndex = this.decodeFileIndex(buf);

        const data = RsBuffer.create(fileIndex.size);

        let chunk = 0, remaining = fileIndex.size;
        ptr = fileIndex.sector * Cache.SECTOR_SIZE;

        do {
            buf = RsBuffer.create(Cache.SECTOR_SIZE);
            this.dataChannel.getBuffer().copy(buf.getBuffer(), 0, ptr, ptr + Cache.SECTOR_SIZE);
            const sector = this.decodeFileSector(buf);

            if(remaining > Cache.DATA_SIZE) {
                sector.data.getBuffer().copy(data.getBuffer(), data.getWriterIndex(), 0, Cache.DATA_SIZE);
                data.setWriterIndex(data.getWriterIndex() + Cache.DATA_SIZE);
                remaining -= Cache.DATA_SIZE;

                if(sector.type != index) {
                    throw new Error('File type mismatch.');
                }

                if(sector.id != fileId) {
                    throw new Error('File id mismatch.');
                }

                if(sector.chunk != chunk++) {
                    throw new Error('Chunk mismatch.');
                }

                ptr = sector.nextSector * Cache.SECTOR_SIZE;
            } else {
                sector.data.getBuffer().copy(data.getBuffer(), data.getWriterIndex(), 0, remaining);
                data.setWriterIndex(data.getWriterIndex() + remaining);
                remaining = 0;
            }
        } while (remaining > 0);

        return data;
    }

}
