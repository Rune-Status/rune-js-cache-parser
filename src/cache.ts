import { ItemDefinition } from './definitions/item-definition';
import { NpcDefinition } from './definitions/npc-definition';
import { LandscapeObjectDefinition } from './definitions/landscape-object-definition';

export class GameCache {

    public itemDefinitions: Map<number, ItemDefinition>;
    public npcDefinitions: Map<number, NpcDefinition>;
    public landscapeObjectDefinitions: Map<number, LandscapeObjectDefinition>;

}
