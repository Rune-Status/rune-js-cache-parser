import { gunzipSync } from 'zlib';
import { decryptXtea } from './xtea';
import { ByteBuffer } from '../net/byte-buffer';
const seekBzip = require('seek-bzip');

export function decompressBzip(data: ByteBuffer): ByteBuffer {
    const buffer = Buffer.alloc(data.length + 4);
    data.copy(buffer, 4);
    buffer[0] = 'B'.charCodeAt(0);
    buffer[1] = 'Z'.charCodeAt(0);
    buffer[2] = 'h'.charCodeAt(0);
    buffer[3] = '1'.charCodeAt(0);

    return new ByteBuffer(seekBzip.decode(buffer));
}

export function decompress(buffer: ByteBuffer, keys?: number[]): { type: number, buffer: ByteBuffer, version: number } {
    const type = buffer.get('BYTE', 'UNSIGNED');
    const length = buffer.get('INT');

    if(type == 0) {
        const data = new ByteBuffer(length);
        buffer.copy(data, 0, buffer.readerIndex, length);
        const decryptedData = decryptXtea(data, keys, length);
        buffer.readerIndex = (buffer.readerIndex + length);

        let version = -1;
        if(buffer.readable >= 2) {
            version = buffer.get('SHORT');
        }

        return { type, buffer: decryptedData, version };
    } else {
        const uncompressedLength = buffer.get('INT');

        const compressed = new ByteBuffer(length);
        buffer.copy(compressed, 0, buffer.readerIndex, buffer.readerIndex + length);
        const decryptedData = decryptXtea(compressed, keys, length);
        buffer.readerIndex = (buffer.readerIndex + length);

        try {
            let uncompressed: ByteBuffer;
            if(type == 1) { // BZIP2
                uncompressed = decompressBzip(decryptedData);
            } else if(type == 2) { // GZIP
                uncompressed = new ByteBuffer(gunzipSync(decryptedData));
            } else {
                throw new Error(`Invalid compression type`);
            }

            if(uncompressed.length != uncompressedLength) {
                throw new Error(`Length mismatch`);
            }

            let version = -1;
            if(buffer.readable >= 2) {
                version = buffer.get('SHORT');
            }

            return { type, buffer: uncompressed, version };
        } catch(err) {
            // logger.error(err);
            return null;
        }
    }
}
