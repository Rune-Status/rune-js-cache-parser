import { RsBuffer } from '../net/rs-buffer';

export class JagexFile {

    public nameHash: number;

    public constructor(public content: RsBuffer) {
    }

}
