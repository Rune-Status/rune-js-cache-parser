import { join } from 'path';
import { readFileSync } from 'fs';
import { RsBuffer } from '../net/rs-buffer';
import { Index, IndexType } from './index';
import { parseItemDefinitions } from './definitions/item-definitions';
import { decompress } from '../util/compression-util';
import { GameCache } from '../cache';
import { parseNpcDefinitions } from './definitions/npc-definitions';
import { parseLandscapeObjectDefinitions } from './definitions/landscape-object-definitions';
import { parseWidgets, WidgetDefinition } from './screen/widgets';
import { parseSprites, Sprite } from './screen/sprites';
import { Archive } from './archive';

export class Cache extends GameCache {

    public static readonly INDEX_SIZE = 6;
    public static readonly HEADER_SIZE = 8;
    public static readonly DATA_SIZE = 512;
    public static readonly SECTOR_SIZE = Cache.HEADER_SIZE + Cache.DATA_SIZE;

    public dataChannel: RsBuffer;
    public indexChannels: RsBuffer[];
    public metaChannel: RsBuffer;

    public indices: Map<number, Index> = new Map<number, Index>();

    public widgetDefinitions: Map<number, WidgetDefinition>;
    public sprites: Map<string, Sprite>;


    public constructor(public cacheDirectory: string) {
        super();

        this.parseCache();
    }

    private parseCache(): void {
        this.buildChannels();
        this.parseIndices();

        const itemDefinitionArchive = this.getArchive(this.indices.get(IndexType.DEFINITIONS), 10);
        const npcDefinitionArchive = this.getArchive(this.indices.get(IndexType.DEFINITIONS), 9);
        const landscapeObjectDefinitionArchive = this.getArchive(this.indices.get(IndexType.DEFINITIONS), 6);

        const landscapeIndex = this.indices.get(IndexType.MAPS);
        console.log('m = ' + landscapeIndex.archives.size);

        this.itemDefinitions = parseItemDefinitions(itemDefinitionArchive);
        this.npcDefinitions = parseNpcDefinitions(npcDefinitionArchive);
        this.landscapeObjectDefinitions = parseLandscapeObjectDefinitions(landscapeObjectDefinitionArchive);
        this.widgetDefinitions = parseWidgets(this);
        this.sprites = parseSprites(this);
    }

    private parseIndices(): void {
        for(let i = 0; i < this.indexChannels.length; i++) {
            const indexData = decompress(this.getRawCacheFile(255, i));
            this.indices.set(i, new Index(this, i, indexData.buffer));
        }
    }

    private buildChannels(): void {
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

    public getFile(index: Index, fileId: number): Archive {
        const buffer = this.getDecompressedFile(index, fileId);
        const archive = index.archives.get(fileId);

        if(!archive) {
            return null;
        }

        archive.buffer = buffer;
        return archive;
    }

    public getArchive(index: Index, archiveId: number): Archive {
        const buffer = this.getDecompressedFile(index, archiveId);
        const archive = index.archives.get(archiveId);

        if(!archive) {
            return null;
        }

        return archive.decodeFiles(buffer, archive.files.size);
    }

    private getDecompressedFile(index: Index, fileId: number): RsBuffer {
        const fileData = this.getRawCacheFile(index.id, fileId);
        if(!fileData || fileData.getBuffer().length < 1) {
            return null;
        }

        return decompress(fileData).buffer;
    }

    private decodeFileIndex(buffer: RsBuffer) {
        if(buffer.getReadable() != Cache.INDEX_SIZE) {
            throw new Error('Not Enough Readable Index Data');
        }

        const size = buffer.readMediumBE();
        const sector = buffer.readMediumBE();
        return { size, sector };
    }

    private decodeSector(buffer: RsBuffer) {
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

    public getRawCacheFile(index: number, fileId: number): RsBuffer {
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
            const sector = this.decodeSector(buf);

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
