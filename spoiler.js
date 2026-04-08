export class SpoilerModule {
    constructor(viewer) {
        this.viewer = viewer;
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

        // --- OFFSET CONTROLS ---
        // x: Positive = Right Wing / Negative = Left Wing
        // y: Positive = Forward (Nose) / Negative = Backward (Tail)
        // z: Positive = Up / Negative = Down
        const xOffset = 0.0;  
        const yOffset = -5.0; // Move it back toward the wings
        const zOffset = 3.5;  // Move it up out of the fuselage

        const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(parentPosition);
        const offset = new Cesium.Cartesian3(xOffset, yOffset, zOffset); 
        const finalPos = Cesium.Matrix4.multiplyByPoint(modelMatrix, offset, new Cesium.Cartesian3());

        this.spoilerEntity.position = finalPos;
        this.spoilerEntity.orientation = parentOrientation;
        this.spoilerEntity.model.show = isBraking;

        if (isBraking) {
            console.log("Spoilers deployed at offset:", xOffset, yOffset, zOffset);
        }
    }
}
