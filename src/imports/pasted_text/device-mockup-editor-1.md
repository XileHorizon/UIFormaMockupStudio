Build a polished browser-based 3D device mockup editor that lets users place screenshots onto realistic device models, freely adjust the device angle, and export high-quality transparent assets for websites, portfolios, social media, and app presentations.

The tool should feel like a lightweight combination of Figma, Spline, and a device mockup generator. Prioritize ease of use, visual quality, and fast export over advanced 3D modeling features.

Primary workflow

A user should be able to:

Choose a device model.
Upload a screenshot or interface image.
Automatically map that image onto the device screen.
Rotate and position the device in 3D.
Customize lighting, shadows, materials, background, and camera.
Export a high-resolution PNG or WebP, including transparent-background exports.

The user should not need to understand Blender, UV mapping, or traditional 3D software.

Core editor layout

Create a desktop-first interface with:

A central interactive 3D canvas.
A left sidebar for devices, uploaded images, and scene objects.
A right sidebar for properties and appearance controls.
A compact top toolbar for undo, redo, view controls, save, and export.
A bottom optional timeline or preset carousel only if it adds meaningful value.

The editor should have a professional, minimal interface that does not compete visually with the mockup being designed.

Device library

Start with a small, high-quality device library rather than many poor models.

Include:

Modern generic smartphone.
Rounded modern smartphone.
Tablet.
Laptop.
Desktop monitor.
Browser window.
Optional smartwatch.

Avoid branded logos unless the included models and branding are legally safe to distribute.

Each device should support:

Portrait and landscape orientation where appropriate.
Multiple body colors.
Adjustable screen brightness.
Optional screen reflection.
Optional device shadow.
Accurate screenshot clipping within the screen area.
Rounded corners matching the device display.
An optional bezel-only mode.

Create the device system so additional GLB or GLTF models can be added later through a simple configuration file.

Screenshot placement

Allow the user to upload PNG, JPG, or WebP images.

When an image is uploaded:

Apply it automatically to the selected device screen.
Preserve its aspect ratio.
Provide crop, contain, cover, stretch, scale, and position controls.
Allow the screenshot to be replaced without resetting the device position.
Let the user adjust corner radius, brightness, saturation, and contrast.
Support scrolling-page screenshots by letting the user select a visible crop.
Support animated GIF or MP4 screen content later, but do not make animation part of the initial MVP unless it is easy to implement cleanly.

The screenshot should look embedded in the screen, not pasted on top of the device.

3D controls

Provide intuitive camera and object controls.

Users should be able to:

Orbit around the device.
Pan and zoom the camera.
Rotate the device on the X, Y, and Z axes.
Move the device horizontally, vertically, and in depth.
Scale the device.
Reset the camera.
Reset the object transform.
Switch between perspective and orthographic views.
Enter exact numerical values for rotation, position, scale, and camera field of view.

Include transform gizmos for move, rotate, and scale.

Provide common angle presets such as:

Front.
Slight left.
Slight right.
Top-down.
Isometric left.
Isometric right.
Dramatic low angle.
Floating three-quarter view.

The user should be able to save their own angle presets.

Scene composition

Support multiple devices in one scene.

Users should be able to:

Duplicate devices.
Add multiple screenshots.
Reorder objects.
Lock, hide, rename, and delete objects.
Align devices horizontally or vertically.
Distribute devices evenly.
Group devices.
Control which object is selected.
Create compositions such as a phone in front of a laptop or several phones fanned out.

Add optional simple scene elements:

Rounded cards.
Flat planes.
Pedestals.
Rings.
Soft abstract shapes.
Text labels.

Keep these secondary to the device mockup workflow.

Lighting and appearance

Provide lighting controls that produce attractive results without requiring 3D expertise.

Include presets such as:

Soft studio.
Bright product.
Dark dramatic.
Warm editorial.
Cool technology.
Minimal portfolio.
Soft ambient.
High-contrast rim light.

Allow adjustment of:

Light intensity.
Light direction.
Environment brightness.
Shadow softness.
Shadow opacity.
Contact shadow.
Ambient light.
Rim light.
Device material roughness.
Device material metallic value.
Screen reflection intensity.

Use physically based rendering where practical, but maintain good browser performance.

Backgrounds

Support:

Transparent background.
Solid color.
Linear gradient.
Radial gradient.
Uploaded background image.
Subtle grid.
Soft spotlight.
Blurred color blobs.
Floor plane with adjustable reflection.
Background presets.

Allow the canvas aspect ratio to be changed independently from the viewport.

Include common sizes:

Freeform.
1:1.
4:3.
3:2.
16:9.
9:16.
4:5.
1200 × 630.
1920 × 1080.
1080 × 1080.
1080 × 1350.
1080 × 1920.
Export

Export should be one of the strongest parts of the tool.

Support:

PNG.
Transparent PNG.
WebP.
JPG.
SVG only for browser-window or flat mockups where SVG export is technically appropriate.

Allow:

Custom width and height.
1×, 2×, 3×, and 4× export scaling.
Transparent background.
Shadow inclusion toggle.
Quality setting.
File-size estimate.
Export preview.
Copy image to clipboard where supported.

Exports should be crisp enough for portfolio hero images and large website sections.

Do not add watermarks.

Project persistence

For the first version:

Save projects locally using IndexedDB or local storage.
Autosave changes.
Allow the user to duplicate and rename projects.
Allow project export and import as a JSON file.
Preserve references to uploaded images where possible.
Include a clear indicator showing whether the project has been saved.

Design the data model so cloud accounts and synchronization can be added later, but do not require authentication for the MVP.

Templates

Include a small template gallery demonstrating strong compositions:

Single floating phone.
Phone and laptop.
Three-phone fan.
Tablet dashboard.
Browser window with floating cards.
Dark product hero.
Clean portfolio case-study cover.
App-store presentation.
Mobile-and-desktop responsive showcase.

Templates should be editable and should teach users what the tool can do.

Suggested technology

Use:

React.
TypeScript.
Vite or Next.js.
Three.js with React Three Fiber.
Drei for useful Three.js helpers.
Zustand or another lightweight state-management solution.
Tailwind CSS or a similarly maintainable styling system.
React Hook Form or direct controlled inputs for properties.
IndexedDB for local project persistence.
GLTF or GLB for device models.
A reliable client-side rendering and export approach using the WebGL canvas.

Keep the 3D engine separated from the editor interface and project-state logic.

Suggested architecture:

components/editor
components/canvas
components/properties
components/device-library
components/export
components/templates
three/devices
three/materials
three/lighting
three/camera
store
types
utils
assets/models

Create a configuration-driven device definition format containing:

Device ID.
Display name.
Model path.
Screen mesh name.
Supported orientations.
Default camera position.
Default material settings.
Available body colors.
Screenshot aspect ratio.
Screen corner radius.
Recommended angle presets.
UX expectations

The application should:

Open with a useful example scene rather than a blank screen.
Make it obvious how to replace the sample screenshot.
Have helpful empty states.
Support undo and redo.
Support keyboard shortcuts.
Show tooltips for unfamiliar controls.
Avoid overwhelming users with all advanced controls at once.
Put the most common settings first.
Use collapsible advanced sections.
Maintain smooth interactions on ordinary laptops.
Display loading states while models or images are being processed.
Provide clear error messages when a file cannot be loaded.
Warn users before performing destructive actions.

Suggested keyboard shortcuts:

V: select.
W: move.
E: rotate.
R: scale.
Delete or Backspace: delete selected object.
Ctrl or Cmd + Z: undo.
Ctrl or Cmd + Shift + Z: redo.
Ctrl or Cmd + D: duplicate.
F: focus selected object.
0: reset camera.
Escape: deselect.
Visual direction

The editor itself should feel:

Professional.
Modern.
Neutral.
Fast.
Slightly creative without becoming playful or distracting.
Appropriate for product designers and frontend developers.

Use strong spacing, clean typography, restrained borders, and subtle depth. Avoid excessive gradients, glassmorphism, huge rounded cards, or an obviously AI-generated dashboard aesthetic.

MVP priorities

Build the application in phases.

Phase 1

Implement:

One phone model.
One laptop model.
Screenshot upload.
Accurate screen mapping.
Orbit camera.
Move, rotate, and scale controls.
Angle presets.
Solid and transparent backgrounds.
Basic lighting presets.
PNG export.
Local autosave.
Responsive editor interface.
Phase 2

Add:

Multiple devices.
Scene object list.
Additional device models.
Gradient backgrounds.
Better shadow controls.
Exact transform inputs.
Project import and export.
High-resolution export.
Composition templates.
Phase 3

Add:

Custom GLB import.
Video or animated screen content.
Advanced materials.
Text and decorative scene elements.
Shareable project links.
Cloud storage.
Team features.

Do not start Phase 2 or Phase 3 until the Phase 1 workflow is reliable and visually polished.

Acceptance criteria

The MVP is successful when a user can:

Open the app.
Select a phone or laptop.
Upload a screenshot.
See the screenshot properly clipped and mapped to the screen.
Reangle the device freely in three dimensions.
Apply a clean lighting preset.
choose a transparent or solid background.
Export a sharp PNG suitable for a website hero section.
Reload the application and continue editing the same project.

Before implementing, inspect the existing repository and explain:

The current stack.
What can be reused.
What needs to be added.
The proposed component architecture.
The data model for devices, scenes, and projects.
Any technical risks related to model licensing, UV mapping, transparent export, and high-resolution rendering.

Then implement Phase 1 in small, testable steps. Do not replace working parts of the existing project unnecessarily. Keep the application functional after each meaningful change.