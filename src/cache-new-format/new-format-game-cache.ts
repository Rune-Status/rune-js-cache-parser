import { join } from 'path';
import { readFile, readFileSync } from 'fs';
import { RsBuffer } from '../net/rs-buffer';
import { ReferenceTable } from './reference-table';
import { parseItemDefinitions } from './definitions/item-definitions';
import { NewCacheArchive } from './new-cache-archive';
import { decompressNewFormat } from '../util/compression-util';
import { GameCache } from '../cache';
import { parseNpcDefinitions } from './definitions/npc-definitions';
import { parseLandscapeObjectDefinitions } from './definitions/landscape-object-definitions';
import { parseWidgets, WidgetDefinition } from './screen/widgets';
import { parseSprites, Sprite } from './screen/sprites';

/**
 * The class provides a unified, high-level API for reading the 400-era RuneScape cache.
 * @author Graham
 * @author `Discardedx2
 * @author TheBlackParade: Definition parsing.
 */
export class NewFormatGameCache extends GameCache {

    public static readonly INDEX_SIZE = 6;
    public static readonly HEADER_SIZE = 8;
    public static readonly DATA_SIZE = 512;
    public static readonly SECTOR_SIZE = NewFormatGameCache.HEADER_SIZE + NewFormatGameCache.DATA_SIZE;

    public dataChannel: RsBuffer;
    public indexChannels: RsBuffer[];
    public metaChannel: RsBuffer;

    public widgetDefinitions: Map<number, WidgetDefinition>;
    public sprites: Map<string, Sprite>;

    /*
     id0:   skeleton,
     id1:   skin,
     id2:   config (item/npc/object definitions),
     id3:   widgets,
     id4:   sound effects,
     id5:   maps,
     id6:   music,
     id7:   models,
     id8:   sprites,
     id9:   textures,
     id10:  huffman,
     id11:  music2,
     id12:  cs2 (client scripts),
     id255: indices
     */
    // @TODO cleanup naming of things
    public constructor(cacheDirectory: string) {
        super();

        this.dataChannel = new RsBuffer(readFileSync(join(cacheDirectory, 'main_file_cache.dat2')));
        this.indexChannels = [];

        for(let i = 0; i < 254; i++) {
            try {
                const index = new RsBuffer(readFileSync(join(cacheDirectory, `main_file_cache.idx${i}`)));
                this.indexChannels.push(index);
            } catch(error) {
                break;
            }
        }

        this.metaChannel = new RsBuffer(readFileSync(join(cacheDirectory, 'main_file_cache.idx255')));

        this.parseCache();
    }

    private parseCache(): void {
        const itemDefinitionArchive = this.getDecodedArchiveFileWithReferenceTable(2, 10);
        const npcDefinitionArchive = this.getDecodedArchiveFileWithReferenceTable(2, 9);
        const landscapeObjectDefinitionArchive = this.getDecodedArchiveFileWithReferenceTable(2, 6);

        const widgetReferenceTableData = decompressNewFormat(this.getRawCacheFile(255, 3));
        const widgetReferenceTable = ReferenceTable.decodeReferenceTable(widgetReferenceTableData.data);

        const spriteReferenceTableData = decompressNewFormat(this.getRawCacheFile(255, 8));
        const spriteReferenceTable = ReferenceTable.decodeReferenceTable(spriteReferenceTableData.data);

        this.itemDefinitions = parseItemDefinitions(itemDefinitionArchive);
        this.npcDefinitions = parseNpcDefinitions(npcDefinitionArchive);
        this.landscapeObjectDefinitions = parseLandscapeObjectDefinitions(landscapeObjectDefinitionArchive);
        this.widgetDefinitions = parseWidgets(this, widgetReferenceTable);
        this.sprites = parseSprites(this, spriteReferenceTable);
    }

    public getDecompressedFile(type: number, file: number): RsBuffer {
        const fileData = this.getRawCacheFile(type, file);
        if(!fileData || fileData.getBuffer().length < 1) {
            return null;
        }

        const cacheFileData = decompressNewFormat(fileData);
        return cacheFileData.data;
    }

    public getDecodedArchiveFile(referenceTable: ReferenceTable, type: number, file: number): NewCacheArchive {
        const fileData = this.getRawCacheFile(type, file);
        if(!fileData || fileData.getBuffer().length < 1) {
            return null;
        }

        const cacheFileData = decompressNewFormat(fileData);
        const entry = referenceTable.entries.get(file);
        return NewCacheArchive.decodeArchive(cacheFileData.data, entry.capacity());
    }

    public getDecodedArchiveFileWithReferenceTable(type: number, file: number): NewCacheArchive {
        const cacheFileData = decompressNewFormat(this.getRawCacheFile(type, file));
        const referenceTableData = decompressNewFormat(this.getRawCacheFile(255, type));
        const referenceTable = ReferenceTable.decodeReferenceTable(referenceTableData.data);

        const entry = referenceTable.entries.get(file);
        return NewCacheArchive.decodeArchive(cacheFileData.data, entry.capacity());
    }

    private decodeIndex(buffer: RsBuffer) {
        if(buffer.getReadable() != NewFormatGameCache.INDEX_SIZE) {
            throw 'Not Enough Readable Index Data';
        }

        const size = buffer.readMediumBE();
        const sector = buffer.readMediumBE();
        return { size, sector };
    }

    private decodeSector(buffer: RsBuffer) {
        if(buffer.getReadable() != NewFormatGameCache.SECTOR_SIZE) {
            throw 'Not Enough Readable Sector Data';
        }

        const id = buffer.readUnsignedShortBE();
        const chunk = buffer.readUnsignedShortBE();
        const nextSector = buffer.readMediumBE();
        const type = buffer.readUnsignedByte();
        const data = RsBuffer.create(NewFormatGameCache.DATA_SIZE);
        buffer.getBuffer().copy(data.getBuffer(), 0, buffer.getReaderIndex(), buffer.getReaderIndex() + NewFormatGameCache.DATA_SIZE);

        return { id, chunk, nextSector, type, data };
    }

    public getRawCacheFile(type: number, id: number): RsBuffer {
        const indexChannel = type == 255 ? this.metaChannel : this.indexChannels[type];

        let ptr = id * NewFormatGameCache.INDEX_SIZE;
        if(ptr < 0 || ptr >= indexChannel.getBuffer().length) {
            throw 'File Not Found';
        }

        let buf = RsBuffer.create(NewFormatGameCache.INDEX_SIZE);
        indexChannel.getBuffer().copy(buf.getBuffer(), 0, ptr, ptr + NewFormatGameCache.INDEX_SIZE);

        const index = this.decodeIndex(buf);

        const data = RsBuffer.create(index.size);

        let chunk = 0, remaining = index.size;
        ptr = index.sector * NewFormatGameCache.SECTOR_SIZE;

        do {
            buf = RsBuffer.create(NewFormatGameCache.SECTOR_SIZE);
            this.dataChannel.getBuffer().copy(buf.getBuffer(), 0, ptr, ptr + NewFormatGameCache.SECTOR_SIZE);
            const sector = this.decodeSector(buf);

            if(remaining > NewFormatGameCache.DATA_SIZE) {
                sector.data.getBuffer().copy(data.getBuffer(), data.getWriterIndex(), 0, NewFormatGameCache.DATA_SIZE);
                data.setWriterIndex(data.getWriterIndex() + NewFormatGameCache.DATA_SIZE);
                remaining -= NewFormatGameCache.DATA_SIZE;

                if(sector.type != type) {
                    throw 'File type mismatch.';
                }

                if(sector.id != id) {
                    throw 'File id mismatch.';
                }

                if(sector.chunk != chunk++) {
                    throw 'Chunk mismatch.';
                }

                ptr = sector.nextSector * NewFormatGameCache.SECTOR_SIZE;
            } else {
                sector.data.getBuffer().copy(data.getBuffer(), data.getWriterIndex(), 0, remaining);
                data.setWriterIndex(data.getWriterIndex() + remaining);
                remaining = 0;
            }
        } while (remaining > 0);

        return data;
    }

}
