export class SpoilerModule {
    constructor(viewer) {
        this.viewer = viewer;
        this.spoilerUri = 'https://github.com/vaibhavbahadur-cpu/7478i2/raw/refs/heads/main/Fantastic%20Bojo-Migelo.glb';
        this.spoilerEntity = null;
    }

    // This creates the spoilers in the world
    setup(parentEntity) {
        this.spoilerEntity = this.viewer.entities.add({
            name: '747_Spoilers',
            position: parentEntity.position,
            orientation: parentEntity.orientation,
            model: {
                uri: this.spoilerUri,
                minimumPixelSize: 128,
                show: false // Hidden by default
            }
        });
    }

    // This keeps the spoilers glued to the plane and checks for the B key
    update(parentPosition, parentOrientation, isBraking) {
        if (!this.spoilerEntity) return;

        // Perfect bond: copy the plane's movements exactly
        this.spoilerEntity.position = parentPosition;
        this.spoilerEntity.orientation = parentOrientation;

        // Toggle visibility based on the B key
        this.spoilerEntity.model.show = isBraking;
    }
}
