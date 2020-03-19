import { RsBuffer } from '..';
import { JagexFile } from './jagex-file';

export class Archive extends JagexFile {

    public nameHash: number = -1;
    public crc: number;
    public whirlpool: RsBuffer = RsBuffer.create(64);
    public version: number;
    public files: Map<number, JagexFile>;

    public constructor(id: number) {
        super(id, null);
        this.files = new Map<number, JagexFile>();
    }

    public decodeFiles(buffer: RsBuffer, size: number): Archive {
        if(size < 1) {
            throw new Error('Archive size can not be less than 1.');
        }

        this.content = buffer;
        this.files = new Map<number, JagexFile>();
        buffer.setReaderIndex(buffer.getBuffer().length - 1);
        const chunkCount = buffer.readUnsignedByte();

        const chunkSizes: number[][] = new Array(chunkCount).fill(new Array(size));
        const sizes: number[] = new Array(size).fill(0);
        buffer.setReaderIndex(buffer.getBuffer().length - 1 - chunkCount * size * 4);
        for(let chunk = 0; chunk < chunkCount; chunk++) {
            let chunkSize = 0;
            for(let id = 0; id < size; id++) {
                const delta = buffer.readIntBE();
                chunkSize += delta;

                chunkSizes[chunk][id] = chunkSize;
                sizes[id] += chunkSize;
            }
        }

        for(let id = 0; id < size; id++) {
            this.files.set(id, new JagexFile(id, RsBuffer.create(sizes[id])));
        }

        buffer.setReaderIndex(0);
        for(let chunk = 0; chunk < chunkCount; chunk++) {
            for(let id = 0; id < size; id++) {
                const chunkSize = chunkSizes[chunk][id];
                this.files.get(id).content.writeBytes(buffer.getSlice(buffer.getReaderIndex(), chunkSize));
                buffer.getBuffer().copy(this.files.get(id).content.getBuffer(), 0, buffer.getReaderIndex(), buffer.getReaderIndex() + chunkSize);
                buffer.setReaderIndex(buffer.getReaderIndex() + chunkSize);
            }
        }

        return this;
    }

    public get size(): number {
        return this.files.size;
    }

}
