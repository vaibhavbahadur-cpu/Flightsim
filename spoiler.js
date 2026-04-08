export class SpoilerModule {
    constructor(viewer) {
        this.viewer = viewer;
        // Using GitHack to ensure the GLB loads correctly in the browser
        this.spoilerUri = 'https://raw.githack.com/vaibhavbahadur-cpu/7478i2/main/Fantastic%20Bojo-Migelo.glb';
        this.spoilerEntity = null;
    }

    setup(parentEntity) {
        this.spoilerEntity = this.viewer.entities.add({
            name: '747_Spoilers',
            position: parentEntity.position,
            orientation: parentEntity.orientation,
            model: {
                uri: this.spoilerUri,
                minimumPixelSize: 128,
                show: false 
            }
        });
    }

    update(parentPosition, parentOrientation, isBraking) {
        if (!this.spoilerEntity) return;

        // OFFSET LOGIC: This lifts the spoilers 0.5 meters UP from the plane's center
        // so they don't disappear inside the 3D wing model.
        const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(parentPosition);
        const offset = new Cesium.Cartesian3(0, 0, 0.5); 
        const finalPos = Cesium.Matrix4.multiplyByPoint(modelMatrix, offset, new Cesium.Cartesian3());

        this.spoilerEntity.position = finalPos;
        this.spoilerEntity.orientation = parentOrientation;

        // Toggle visibility with the B key
        this.spoilerEntity.model.show = isBraking;
    }
}
