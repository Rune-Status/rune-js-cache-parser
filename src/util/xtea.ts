import { RsBuffer } from '../net/rs-buffer';

const GOLDEN_RATIO = 0x9E3779B9;
const ROUNDS = 32;

export function decryptXtea(input: RsBuffer, keys: number[], length: number): RsBuffer {
    if(!keys || keys.length === 0) {
        return input;
    }

    const output = RsBuffer.create(length);
    const numBlocks = Math.floor(length / 8);

    for(let block = 0; block < numBlocks; block++) {
        let v0 = input.readIntBE();
        let v1 = input.readIntBE();
        let sum = GOLDEN_RATIO * ROUNDS;

        for(let i = 0; i < ROUNDS; i++) {
            v1 -= (((v0 << 4) ^ (v0 >>> 5)) + v0) ^ (sum + keys[(sum >>> 11) & 3]);
            sum -= GOLDEN_RATIO;
            v0 -= (((v1 << 4) ^ (v1 >>> 5)) + v1) ^ (sum + keys[sum & 3]);
        }

        output.writeIntBE(v0);
        output.writeIntBE(v1);
    }

    input.getBuffer().copy(output.getBuffer(), output.getWriterIndex(), input.getReaderIndex());

    return output;
}
