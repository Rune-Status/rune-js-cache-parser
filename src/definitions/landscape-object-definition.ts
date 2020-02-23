export class LandscapeObjectDefinition {
    id: number;
    name: string;
    format: 'EARLY' | 'NEW';
    sizeX: number;
    sizeY: number;
    solid: boolean;
    nonWalkable: boolean;
    hasOptions: boolean;
    options: string[];
    adjustToTerrain: boolean;
    nonFlatShading: boolean;
    animationId: number;
    face: number;
    translateX: number;
    translateY: number;
    translateLevel: number;
}

export class NewFormatLandscapeObjectDefinition extends LandscapeObjectDefinition {
    aBoolean2528: boolean;

    constructor() {
        super();
        this.format = 'NEW';
        this.options = new Array(5).fill(null);
        this.sizeX = 1;
        this.sizeY = 1;
        this.solid = true;
        this.nonWalkable = true;
        this.hasOptions = false;
        this.face = 0;
        this.translateX = 0;
        this.translateY = 0;
        this.translateLevel = 0;
        this.adjustToTerrain = false;
        this.nonFlatShading = false;
        this.animationId = -1;
    }
}

export class EarlyFormatLandscapeObjectDefinition extends LandscapeObjectDefinition {
    description: string;

    constructor() {
        super();
        this.format = 'EARLY';
    }
}
