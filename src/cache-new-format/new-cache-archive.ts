import { RsBuffer } from '../net/rs-buffer';

export class NewCacheArchive {

    public buffer: RsBuffer;
    public entries: RsBuffer[];

    private constructor(size: number) {
        this.entries = new Array(size);
    }

    public static decodeArchive(buffer: RsBuffer, size: number): NewCacheArchive {
        const archive = new NewCacheArchive(size);
        archive.buffer = buffer;
        buffer.setReaderIndex(buffer.getBuffer().length - 1);
        const chunks = buffer.readUnsignedByte();

        const chunkSizes: number[][] = new Array(chunks).fill(new Array(size));
        const sizes: number[] = new Array(size).fill(0);
        buffer.setReaderIndex(buffer.getBuffer().length - 1 - chunks * size * 4);
        for(let chunk = 0; chunk < chunks; chunk++) {
            let chunkSize = 0;
            for(let id = 0; id < size; id++) {
                const delta = buffer.readIntBE();
                chunkSize += delta;

                chunkSizes[chunk][id] = chunkSize;
                sizes[id] += chunkSize;
            }
        }

        for(let id = 0; id < size; id++) {
            archive.entries[id] = RsBuffer.create(sizes[id]);
        }

        buffer.setReaderIndex(0);
        for(let chunk = 0; chunk < chunks; chunk++) {
            for(let id = 0; id < size; id++) {
                const chunkSize = chunkSizes[chunk][id];
                archive.entries[id].writeBytes(buffer.getSlice(buffer.getReaderIndex(), chunkSize));
                buffer.getBuffer().copy(archive.entries[id].getBuffer(), 0, buffer.getReaderIndex(), buffer.getReaderIndex() + chunkSize);
                buffer.setReaderIndex(buffer.getReaderIndex() + chunkSize);
            }
        }

        return archive;
    }

}
