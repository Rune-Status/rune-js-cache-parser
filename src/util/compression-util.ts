import { RsBuffer } from '../net/rs-buffer';
import * as zlib from 'zlib';
const seekBzip = require('seek-bzip');

export function decompressBzip(data: RsBuffer): RsBuffer {
    const buffer = Buffer.alloc(data.getBuffer().length + 4);
    data.getBuffer().copy(buffer, 4);
    buffer[0] = 'B'.charCodeAt(0);
    buffer[1] = 'Z'.charCodeAt(0);
    buffer[2] = 'h'.charCodeAt(0);
    buffer[3] = '1'.charCodeAt(0);

    return new RsBuffer(seekBzip.decode(buffer));
}

export function decompress(buffer: RsBuffer): { type: number, buffer: RsBuffer, version: number } {
    const type = buffer.readUnsignedByte();
    const length = buffer.readIntBE();

    if(type == 0) {
        const uncompressedData = RsBuffer.create(length);
        buffer.getBuffer().copy(uncompressedData.getBuffer(), 0, buffer.getReaderIndex(), length);
        buffer.setReaderIndex(buffer.getReaderIndex() + length);

        let version = -1;
        if(buffer.getReadable() >= 2) {
            version = buffer.readShortBE();
        }

        return { type, buffer: uncompressedData, version };
    } else {
        const uncompressedLength = buffer.readIntBE();

        const compressed = RsBuffer.create(length);
        buffer.getBuffer().copy(compressed.getBuffer(), 0, buffer.getReaderIndex(), buffer.getReaderIndex() + length);
        buffer.setReaderIndex(buffer.getReaderIndex() + length);

        let uncompressed: RsBuffer;
        if(type == 1) { // BZIP2
            uncompressed = decompressBzip(compressed);
        } else if(type == 2) { // GZIP
            uncompressed = new RsBuffer(zlib.gunzipSync(compressed.getBuffer()));
        } else {
            throw `Invalid compression type`;
        }

        if(uncompressed.getBuffer().length != uncompressedLength) {
            throw `Length mismatch`;
        }

        let version = -1;
        if(buffer.getReadable() >= 2) {
            version = buffer.readShortBE();
        }

        return { type, buffer: uncompressed, version };
    }
}
