# RuneJS Cache Parser

A cache data parser for 300~ and 400~ era RuneScape game caches.

Currently this package is only for parsing, not packaging. Cache packaging is planned for a future release.

## Usage: 300-era Caches

New up an instance of the `EarlyFormatGameCache` class:

`const gameCache = new EarlyFormatGameCache('your-cache-directory', options);`

`options` is an object containing the following parameters:
```
{ 
    loadDefinitions: boolean, // whether or not to parse item/npc/object definitions
    loadWidgets: boolean, // whether or not to parse widget definitions 
    loadMaps: boolean  // whether or not to parse landscape files
}
```

From here, you'll have access to the following:

- `gameCache.cacheIndices` : A list of indices stored within the game cache.
- `gameCache.definitionArchive` : The game archive containing item, landscape object, and NPC definitions.
- `gameCache.versionListArchive` : The game archive containing versions of maps, animations, graphics, etc.
- `gameCache.itemDefinitions` : The parsed list of game item definitions (obj.dat).
- `gameCache.npcDefinitions` : The parsed list of game npc definitions (npc.dat).
- `gameCache.landscapeObjectDefinitions` : The parsed list of landscape object definitions (loc.dat).
- `gameCache.mapRegions` : Information about the game's map regions.

`gameCache.mapRegions` returns an object of the type `CacheMapRegions`, which contains:

- `gameCache.mapRegions.mapRegionTileList` : A list of all of the tiles within the game world that do not have a metadata value of 0.
- `gameCache.mapRegions.landscapeObjectList` : A list of all of the landscape objects placed within the game world.

## Usage: 400-era Caches

New up an instance of the `NewFormatGameCache` class:

`const gameCache = new NewFormatGameCache('your-cache-directory');`

From here, you'll have access to the following:

- `gameCache.itemDefinitions` : The parsed list of game item definitions.
- `gameCache.npcDefinitions` : The parsed list of game npc definitions.
- `gameCache.landscapeObjectDefinitions` : The parsed list of landscape object definitions.
- `gameCache.widgetDefinitions` : The parsed list of game widgets (interfaces).
