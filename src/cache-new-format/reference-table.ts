import { RsBuffer } from '..';

export class ChildEntry {
    identifier: number = -1;
}

export class Entry {
    identifier: number = -1;
    crc: number;
    whirlpool: RsBuffer = RsBuffer.create(64);
    version: number;
    entries: Map<number, ChildEntry> = new Map<number, ChildEntry>();

    public capacity(): number {
        return this.entries.size;
    }
}

/**
 * A {@link ReferenceTable} holds details for all the files with a single
 * type, such as checksums, versions and archive members. There are also
 * optional fields for identifier hashes and whirlpool digests.
 * @author Graham
 * @author `Discardedx2
 *
 * TypeScript conversion by TheBlackParade
 */
export class ReferenceTable {

    public static readonly FLAG_IDENTIFIERS = 0x01;
    public static readonly FLAG_WHIRLPOOL = 0x02;

    public format: number;
    public version: number;
    public flags: number;
    public entries: Map<number, Entry> = new Map<number, Entry>();

    public static decodeReferenceTable(buffer: RsBuffer): ReferenceTable {
        const table = new ReferenceTable();

        /* read header */
        table.format = buffer.readUnsignedByte();
        if (table.format >= 6) {
            table.version = buffer.readIntBE();
        }
        table.flags = buffer.readUnsignedByte();

        /* read the ids */
        const ids: number[] = new Array(buffer.readUnsignedShortBE());
        let accumulator = 0, size = -1;
        for(let i = 0; i < ids.length; i++) {
            let delta = buffer.readUnsignedShortBE();
            ids[i] = accumulator += delta;
            if (ids[i] > size) {
                size = ids[i];
            }
        }
        size++;

        for(const id of ids) {
            table.entries.set(id, new Entry());
        }

        /* read the identifiers if present */
        if ((table.flags & ReferenceTable.FLAG_IDENTIFIERS) != 0) {
            for(const id of ids) {
                table.entries.get(id).identifier = buffer.readIntBE();
            }
        }

        /* read the CRC32 checksums */
        for(const id of ids) {
            table.entries.get(id).crc = buffer.readIntBE();
        }

        /* read the whirlpool digests if present */
        if((table.flags & ReferenceTable.FLAG_WHIRLPOOL) != 0) {
            for(const id of ids) {
                buffer.getBuffer().copy(table.entries.get(id).whirlpool.getBuffer(), 0, buffer.getReaderIndex(), buffer.getReaderIndex() + 64);
                buffer.setReaderIndex(buffer.getReaderIndex() + 64);
            }
        }

        /* read the version numbers */
        for(const id of ids) {
            table.entries.get(id).version = buffer.readIntBE();
        }

        /* read the child sizes */
        const members: number[][] = new Array(size).fill([]);
        for(const id of ids) {
            members[id] = new Array(buffer.readUnsignedShortBE());
        }

        /* read the child ids */
        for(const id of ids) {
            /* reset the accumulator and size */
            accumulator = 0;
            size = -1;

            /* loop through the array of ids */
            for(let i = 0; i < members[id].length; i++) {
                let delta = buffer.readUnsignedShortBE();
                members[id][i] = accumulator += delta;
                if(members[id][i] > size) {
                    size = members[id][i];
                }
            }

            size++;

            /* and allocate specific entries within the array */
            for(const child of members[id]) {
                table.entries.get(id).entries.set(child, new ChildEntry());
            }
        }

        /* read the child identifiers if present */
        if((table.flags & ReferenceTable.FLAG_IDENTIFIERS) != 0) {
            for(const id of ids) {
                for(const child of members[id]) {
                    table.entries.get(id).entries.get(child).identifier = buffer.readIntBE();
                }
            }
        }

        /* return the table we constructed */
        return table;
    }

}
