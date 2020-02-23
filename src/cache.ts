import { ItemDefinition } from './definitions/item-definition';
import { NpcDefinition } from './definitions/npc-definition';

export class GameCache {

    public itemDefinitions: Map<number, ItemDefinition>;
    public npcDefinitions: Map<number, NpcDefinition>;

}
