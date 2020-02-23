export class ItemDefinition {
    id: number;
    name: string;
    format: 'EARLY' | 'NEW';
    stackable: boolean;
    value: number;
    members: boolean;
    groundOptions: string[] = [ null, null, 'Take', null, null ];
    inventoryOptions: string[] = [ null, null, null, null, 'Drop' ];
    teamIndex: number;
}

export class NewFormatItemDefinition extends ItemDefinition {
    inventoryModelId: number;
    modelZoom: number;
    modelRotation1: number;
    modelRotation2: number;
    modelOffset1: number;
    modelOffset2: number;
    originalModelColors: number[];
    modifiedModelColors: number[];
    notedId: number;
    noteTemplateId: number;
    stackableIds: number[];
    stackableAmounts: number[];

    constructor() {
        super();
        this.format = 'NEW';
    }
}

export class EarlyFormatItemDefinition extends ItemDefinition {
    description: string;
    notedVersionOf: number;

    constructor() {
        super();
        this.format = 'EARLY';
    }
}
