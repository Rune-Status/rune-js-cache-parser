import { RsBuffer } from '../net/rs-buffer';

export class JagexFile {

    public nameHash: number;

    public constructor(public id: number, public content: RsBuffer) {
    }

}
