# RuneJS Cache Parser

A cache data parser for 400~ era RuneScape game caches.

Currently this package is only for decoding, not packaging. Cache re-packaging is planned for a future release.

## Usage

New up an instance of the `Cache` class:

`const cache = new Cache('your-cache-directory', options);`

`options` is an interface with the following properties:

```
items?: boolean;
npcs?: boolean;
locationObjects?: boolean;
widgets?: boolean;
sprites?: boolean;
mapData?: boolean;
```

To automatically decode content archives, set the desired value to true within the options passed to the `Cache` constructor. Alternatively, if you wish to decode all content, you can pass `true` as `options` to decode everything.

From here, you'll have access to the following (if specified in `options`):

- `cache.itemDefinitions` : The decoded list of game item definitions.
- `cache.npcDefinitions` : The decoded list of game npc definitions.
- `cache.locationObjectDefinitions` : The decoded list of location object definitions.
- `cache.widgets` : The decoded list of game widgets (interfaces).
- `cache.sprites` : A decoded map of sprites stored within the game cache with an included `toPng` function.
- `cache.mapData` : Decoded information about the game's map regions.

`cache.mapData` returns an object of the type `MapData`, which contains:

- `mapData.tiles` : A list of all of the tiles within the game world that do not have a flag value of 0.
- `mapData.locationObjects` : A list of all decrypted location objects within the game world (if XTEA keys are available).
