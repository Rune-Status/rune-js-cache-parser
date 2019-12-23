# Rune.JS Cache Parser

A cache data parser for earlier (pre-400) RuneScape game caches.

Currently this package is only for parsing, not packaging. Cache packaging is planned for a future release.

## Usage

To parse the game cache, simply new up an instance of the `GameCache` class:

`const gameCache = new GameCache('your-cache-directory');`

From here, you'll have access to the following:

- `gameCache.cacheIndices` : A list of indices stored within the game cache.
- `gameCache.definitionArchive` : The game archive containing item, landscape object, and NPC definitions.
- `gameCache.versionListArchive` : The game archive containing versions of maps, animations, graphics, etc.
- `gameCache.itemDefinitions` : The parsed list of game item definitions (obj.dat).
- `gameCache.landscapeObjectDefinitions` : The parsed list of landscape object definitions (loc.dat).
- `gameCache.mapRegions` : Information about the game's map regions.

`gameCache.mapRegions` returns an object of the type `CacheMapRegions`, which contains:

- `gameCache.mapRegions.mapRegionTileList` : A list of all of the tiles within the game world that do not have a metadata value of 0.
- `gameCache.mapRegions.landscapeObjectList` : A list of all of the landscape objects placed within the game world.

