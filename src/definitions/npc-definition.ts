export class NpcDefinition {
    id: number;
    name: string;
    format: 'EARLY' | 'NEW';
    animations: {
        stand: number;
        walk: number;
        turnAround: number;
        turnRight: number;
        turnLeft: number;
    };
    options: string[];
    models: number[];
    headModels: number[];
    minimapVisible: boolean;
    combatLevel: number;
    boundary: number;
    sizeX: number;
    sizeY: number;
    renderPriority: boolean;
    headIcon: number;
    clickable: boolean;
    turnDegrees: number;

    constructor() {
        this.animations = {
            stand: -1,
            walk: -1,
            turnAround: -1,
            turnRight: -1,
            turnLeft: -1
        };
    }
}

export class NewFormatNpcDefinition extends NpcDefinition {
    constructor() {
        super();
        this.format = 'NEW';
        this.options = new Array(5).fill(null);
        this.sizeX = 128;
        this.sizeY = 128;
        this.turnDegrees = 32;
        this.boundary = 1;
        this.minimapVisible = true;
        this.renderPriority = false;
        this.clickable = true;
        this.combatLevel = -1;
        this.headIcon = -1;
    }
}

export class EarlyFormatNpcDefinition extends NpcDefinition {
    description: string;

    constructor() {
        super();
        this.format = 'EARLY';
    }
}
