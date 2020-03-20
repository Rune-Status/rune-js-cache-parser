import { ByteBuffer } from '@runejs/byte-buffer';

export class JagexFile {

    public nameHash: number;

    public constructor(public id: number, public content: ByteBuffer) {
    }

}
