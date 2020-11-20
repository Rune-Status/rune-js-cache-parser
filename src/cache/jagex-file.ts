import { ByteBuffer } from '@runejs/core';

export class JagexFile {

    public nameHash: number;

    public constructor(public id: number, public content: ByteBuffer) {
    }

}
