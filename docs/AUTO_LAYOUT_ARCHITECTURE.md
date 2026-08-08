# Auto Layout architecture

## Audit of the previous system

- `APPLY_LAYOUT` directly overwrote transforms using formulas embedded in the reducer. It targeted all visible unlocked devices, not a true selection.
- `GENERATE_PATTERN` deep-copied complete scene objects. Linked groups stored one object per copy and regenerated IDs/count from UI-local settings.
- `patternTransform` was interpreted only in `Canvas3D`, splitting transform math between the reducer and renderer.
- Mirror was alternating placement, not geometric reflection. Ring changed orientation at one position rather than rotating the source's offset around a pivot.
- Only `selectedId` existed, so source groups could not be selected. Layout settings were not persistent project data.
- URL export/import serialized objects, but live layout controls and instance identity/overrides were lost. There is currently no editor undo/redo subsystem.

## Current model

Persistent scene data contains source `objects` and ordered `layouts`. A `LayoutModifier` stores source references, enabled state, typed settings, and sparse per-instance style overrides. Generated objects are never inserted into `objects`.

`evaluateScene` derives render objects from sources and applies matching modifiers in document order. Each modifier consumes transforms from the preceding stage and emits transforms for the next stage. This makes radial → mirror composition ordinary transform evaluation rather than a special case.

Generated IDs are deterministic paths composed from source ID, modifier ID, and output index. Overrides use the same path, so changing a source transform preserves instance styling. Removing a modifier removes its evaluated instances automatically.

## Transform rules

- Radial rotates the source-to-pivot vector around X/Y/Z with quaternions. Full circles use `angle / count`; partial arcs use `angle / (count - 1)` so both endpoints are included.
- Follow orientation composes the path quaternion with source orientation. Preserve orientation retains the source quaternion.
- Mirror enumerates the power set of enabled axes, producing original, each reflection, and all combined reflections. Positions reflect about explicit plane coordinates; Euler orientation is converted to the editor's stable reflected visual equivalent.

## Migration and remaining integration

Legacy `linkedGroupId`/`patternTransform` data remains readable so existing projects are not destroyed. New Radius and Mirror operations use modifiers. The old command panel is hidden while its reducer actions remain temporarily available for imported/legacy workflows.

Undo/redo does not exist elsewhere in this project yet. Modifier actions are intentionally reducer-level atomic actions so a future history wrapper can record add/update/remove and group slider gestures without changing the layout engine.
