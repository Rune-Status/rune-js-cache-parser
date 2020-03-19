import { JagexFile } from './jagex-file';
import { ByteBuffer } from '../net/byte-buffer';

export class Archive extends JagexFile {

    public nameHash: number = -1;
    public crc: number;
    public whirlpool: ByteBuffer = new ByteBuffer(64);
    public version: number;
    public files: Map<number, JagexFile>;

    public constructor(id: number) {
        super(id, null);
        this.files = new Map<number, JagexFile>();
    }

    public decodeFiles(buffer: ByteBuffer, size: number): Archive {
        if(size < 1) {
            throw new Error('Archive size can not be less than 1.');
        }

        this.content = buffer;
        this.files = new Map<number, JagexFile>();
        buffer.readerIndex = (buffer.length - 1);
        const chunkCount = buffer.get('BYTE', 'UNSIGNED');

        const chunkSizes: number[][] = new Array(chunkCount).fill(new Array(size));
        const sizes: number[] = new Array(size).fill(0);
        buffer.readerIndex = (buffer.length - 1 - chunkCount * size * 4);
        for(let chunk = 0; chunk < chunkCount; chunk++) {
            let chunkSize = 0;
            for(let id = 0; id < size; id++) {
                const delta = buffer.get('INT');
                chunkSize += delta;

                chunkSizes[chunk][id] = chunkSize;
                sizes[id] += chunkSize;
            }
        }

        for(let id = 0; id < size; id++) {
            this.files.set(id, new JagexFile(id, new ByteBuffer(sizes[id])));
        }

        buffer.readerIndex = 0;

        for(let chunk = 0; chunk < chunkCount; chunk++) {
            for(let id = 0; id < size; id++) {
                const chunkSize = chunkSizes[chunk][id];
                this.files.get(id).content.writeBytes(buffer.getSlice(buffer.readerIndex, chunkSize));
                buffer.copy(this.files.get(id).content, 0, buffer.readerIndex, buffer.readerIndex + chunkSize);
                buffer.readerIndex = (buffer.readerIndex + chunkSize);
            }
        }

        return this;
    }

    public get size(): number {
        return this.files.size;
    }

}
