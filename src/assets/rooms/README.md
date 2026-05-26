# Room Models

Put presentation room models in this folder as `.gltf` or `.glb` files.

Examples:

- `classroom.gltf`
- `auditorium.glb`
- `seminar-room.gltf`

The app discovers files in this folder at dev/build time and adds them to the room selection list automatically. After adding or renaming a model, restart the Vite dev server if it is already running.

Room models can include two optional named objects:

- `PlayerSpawn`: marks the standing origin for the user. Its position is used as the player/camera rig position, and its Y-axis rotation sets the starting facing direction.
- `ScreenAnchor`: marks where the uploaded presentation should appear. Only its world position is used; the slide display keeps the app's standard size and rotation.

If either object is missing, the app uses a safe default position for that part.
