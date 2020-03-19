import { RsBuffer } from '../net/rs-buffer';
import { gunzipSync } from 'zlib';
import { decryptXtea } from './xtea';
import { logger } from '@runejs/logger/dist/logger';
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

export function decompress(buffer: RsBuffer, keys?: number[]): { type: number, buffer: RsBuffer, version: number } {
    const type = buffer.readUnsignedByte();
    const length = buffer.readIntBE();

    if(type == 0) {
        const data = RsBuffer.create(length);
        buffer.getBuffer().copy(data.getBuffer(), 0, buffer.getReaderIndex(), length);
        const decryptedData = decryptXtea(data, keys, length);
        buffer.setReaderIndex(buffer.getReaderIndex() + length);

        let version = -1;
        if(buffer.getReadable() >= 2) {
            version = buffer.readShortBE();
        }

        return { type, buffer: decryptedData, version };
    } else {
        const uncompressedLength = buffer.readIntBE();

        const compressed = RsBuffer.create(length);
        buffer.getBuffer().copy(compressed.getBuffer(), 0, buffer.getReaderIndex(), buffer.getReaderIndex() + length);
        const decryptedData = decryptXtea(compressed, keys, length);
        buffer.setReaderIndex(buffer.getReaderIndex() + length);

        try {
            let uncompressed: RsBuffer;
            if(type == 1) { // BZIP2
                uncompressed = decompressBzip(decryptedData);
            } else if(type == 2) { // GZIP
                uncompressed = new RsBuffer(gunzipSync(decryptedData.getBuffer()));
            } else {
                throw new Error(`Invalid compression type`);
            }

            if(uncompressed.getBuffer().length != uncompressedLength) {
                throw new Error(`Length mismatch`);
            }

            let version = -1;
            if(buffer.getReadable() >= 2) {
                version = buffer.readShortBE();
            }

            return { type, buffer: uncompressed, version };
        } catch(err) {
            // logger.error(err);
            return null;
        }
    }
}
