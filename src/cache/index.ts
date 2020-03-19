import { RsBuffer } from '..';
import { Archive } from './archive';
import { JagexFile } from './jagex-file';
import { hash } from '../util/name-hash';
import { Cache } from './cache';

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

export class Index {

    public static readonly FLAG_NAME = 0x01;
    public static readonly FLAG_WHIRLPOOL = 0x02;

    public format: number;
    public version: number;
    public flags: number;
    public archives: Map<number, Archive> = new Map<number, Archive>();

    public constructor(private cache: Cache, public id: number, private buffer: RsBuffer) {
        this.parseIndex();
    }

    public getArchive(identifier: number | string, hasFiles: boolean = true): Archive {
        let archive: Archive;

        if(typeof identifier === 'string') {
            const nameHash = hash(identifier);
            const archives = this.archives.values();
            for(const a of archives) {
                if(a.nameHash === nameHash) {
                    archive = a;
                    break;
                }
            }
        } else {
            archive = this.archives.get(identifier);
        }

        if(!archive) {
            throw new Error('Specified archive not found!');
        }

        if(archive.files.size === 0) {
            archive = this.cache.getArchive(this, archive.id);
        }

        if(archive.files.size === 0) {
            throw new Error('Specified archive contains zero files!');
        }

        return archive;
    }

    private parseIndex(): void {
        /* read header */
        this.format = this.buffer.readUnsignedByte();
        if(this.format >= 6) {
            this.version = this.buffer.readIntBE();
        }
        this.flags = this.buffer.readUnsignedByte();

        /* read the ids */
        const ids: number[] = new Array(this.buffer.readUnsignedShortBE());
        let accumulator = 0, size = -1;
        for(let i = 0; i < ids.length; i++) {
            let delta = this.buffer.readUnsignedShortBE();
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
                this.archives.get(id).nameHash = this.buffer.readIntBE();
            }
        }

        /* read the crc checksums */
        for(const id of ids) {
            this.archives.get(id).crc = this.buffer.readIntBE();
        }

        /* read the whirlpool digests */
        if((this.flags & Index.FLAG_WHIRLPOOL) != 0) {
            for(const id of ids) {
                this.buffer.getBuffer().copy(this.archives.get(id).whirlpool.getBuffer(), 0,
                    this.buffer.getReaderIndex(), this.buffer.getReaderIndex() + 64);
                this.buffer.setReaderIndex(this.buffer.getReaderIndex() + 64);
            }
        }

        /* read the version numbers */
        for(const id of ids) {
            this.archives.get(id).version = this.buffer.readIntBE();
        }

        /* read the child sizes */
        const members: number[][] = new Array(size).fill([]);
        for(const id of ids) {
            members[id] = new Array(this.buffer.readUnsignedShortBE());
        }

        /* read the child ids */
        for(const id of ids) {
            accumulator = 0;
            size = -1;

            for(let i = 0; i < members[id].length; i++) {
                let delta = this.buffer.readUnsignedShortBE();
                members[id][i] = accumulator += delta;
                if(members[id][i] > size) {
                    size = members[id][i];
                }
            }

            size++;

            /* allocate specific entries within the array */
            for(const child of members[id]) {
                this.archives.get(id).files.set(child, new JagexFile(null));
            }
        }

        /* read the child name hashes */
        if((this.flags & Index.FLAG_NAME) != 0) {
            for(const id of ids) {
                for(const child of members[id]) {
                    this.archives.get(id).files.get(child).nameHash = this.buffer.readIntBE();
                }
            }
        }
    }

}
