import { Archive } from './archive';
import { JagexFile } from './jagex-file';
import { hash } from '../util/name-hash';
import { Cache } from './cache';
import { ByteBuffer } from '../net/byte-buffer';

/**
 * A list of cache index types.
 */
export enum IndexType {
    SKELETON = 0,
    SKIN = 1,
    DEFINITIONS = 2,
    WIDGETS = 3,
    SOUND_EFFECTS = 4,
    MAPS = 5,
    MUSIC = 6,
    MODELS = 7,
    SPRITES = 8,
    TEXTURES = 9,
    HUFFMAN = 10,
    JINGLES = 11,
    CS2 = 12,
    META = 13
}

/**
 * Information and archives relating to a specific cache index.
 */
export class Index {

    public static readonly FLAG_NAME = 0x01;
    public static readonly FLAG_WHIRLPOOL = 0x02;

    public format: number;
    public version: number;
    public flags: number;
    public archives: Map<number, Archive> = new Map<number, Archive>();

    public constructor(private cache: Cache, public id: number, private buffer: ByteBuffer) {
        this.parseIndex();
    }

    /**
     * Fetches a file from this index by ID or by name.
     * @param identifier The ID or name of the file to search for.
     * @param keys The XTEA keys used to decrypt this file.
     */
    public getFile(identifier: number | string, keys?: number[]): Archive {
        let archive = this.findArchiveOrFile(identifier);
        if(!archive) {
            return null;
        }

        if(!archive.content) {
            archive = this.cache.getFile(this, archive.id, keys);
        }

        if(!archive || !archive.content) {
            return null;
        }

        return archive;
    }

    /**
     * Fetches a file's ID based on the given file name.
     * @param name The name of the file to search for.
     */
    public getFileId(name: string): number {
        let archive = this.findArchiveOrFile(name);
        if(!archive) {
            return -1;
        }

        return archive.id;
    }

    /**
     * Fetches an archive from this index by ID or by name.
     * @param identifier The ID or name of the archive to search for.
     * @param keys The XTEA keys used to decrypt this archive.
     */
    public getArchive(identifier: number | string, keys?: number[]): Archive {
        let archive = this.findArchiveOrFile(identifier);
        if(!archive) {
            return null;
        }

        if(archive.files.size === 0) {
            archive = this.cache.getArchive(this, archive.id, keys);
        }

        if(!archive || archive.files.size === 0) {
            return null;
        }

        return archive;
    }

    private findArchiveOrFile(identifier: number | string): Archive {
        let archive: Archive;

        if(typeof identifier === 'string') {
            const nameHash = hash(identifier);
            const archives = this.archives.values();
            for(const a of archives) {
                if(!a.nameHash) {
                    continue;
                }

                if(a.nameHash === nameHash) {
                    archive = a;
                    break;
                }
            }
        } else {
            archive = this.archives.get(identifier);
        }

        if(!archive) {
            return null;
        }

        return archive;
    }

    private parseIndex(): void {
        /* read header */
        this.format = this.buffer.get('BYTE', 'UNSIGNED');
        if(this.format >= 6) {
            this.version = this.buffer.get('INT');
        }
        this.flags = this.buffer.get('BYTE', 'UNSIGNED');

        /* read the ids */
        const ids: number[] = new Array(this.buffer.get('SHORT', 'UNSIGNED'));
        let accumulator = 0, size = -1;
        for(let i = 0; i < ids.length; i++) {
            let delta = this.buffer.get('SHORT', 'UNSIGNED');
            ids[i] = accumulator += delta;
            if(ids[i] > size) {
                size = ids[i];
            }
        }
        size++;

        for(const id of ids) {
            this.archives.set(id, new Archive(id));
        }

        /* read the name hashes if present */
        if((this.flags & Index.FLAG_NAME) != 0) {
            for(const id of ids) {
                this.archives.get(id).nameHash = this.buffer.get('INT');
            }
        }

        /* read the crc checksums */
        for(const id of ids) {
            this.archives.get(id).crc = this.buffer.get('INT');
        }

        /* read the whirlpool digests */
        if((this.flags & Index.FLAG_WHIRLPOOL) != 0) {
            for(const id of ids) {
                this.buffer.copy(this.archives.get(id).whirlpool, 0,
                    this.buffer.readerIndex, this.buffer.readerIndex + 64);
                this.buffer.readerIndex = (this.buffer.readerIndex + 64);
            }
        }

        /* read the version numbers */
        for(const id of ids) {
            this.archives.get(id).version = this.buffer.get('INT');
        }

        /* read the child sizes */
        const members: number[][] = new Array(size).fill([]);
        for(const id of ids) {
            members[id] = new Array(this.buffer.get('SHORT', 'UNSIGNED'));
        }

        /* read the child ids */
        for(const id of ids) {
            accumulator = 0;
            size = -1;

            for(let i = 0; i < members[id].length; i++) {
                let delta = this.buffer.get('SHORT', 'UNSIGNED');
                members[id][i] = accumulator += delta;
                if(members[id][i] > size) {
                    size = members[id][i];
                }
            }

            size++;

            /* allocate specific entries within the array */
            for(const childId of members[id]) {
                this.archives.get(id).files.set(childId, new JagexFile(childId, null));
            }
        }

        /* read the child name hashes */
        if((this.flags & Index.FLAG_NAME) != 0) {
            for(const id of ids) {
                for(const childId of members[id]) {
                    this.archives.get(id).files.get(childId).nameHash = this.buffer.get('INT');
                }
            }
        }
    }

}
