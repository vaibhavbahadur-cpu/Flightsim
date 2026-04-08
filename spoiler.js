export class SpoilerModule {
    constructor(viewer) {
        this.viewer = viewer;
        this.spoilerUri = 'https://raw.githack.com/vaibhavbahadur-cpu/7478i2/main/Fantastic%20Bojo-Migelo.glb';
        this.spoilerEntity = null;
        console.log("SPOILER MODULE: Initialized");
    }

    setup(parentEntity) {
        console.log("SPOILER MODULE: Setting up entity...");
        this.spoilerEntity = this.viewer.entities.add({
            name: '747_Spoilers',
            position: parentEntity.position,
            orientation: parentEntity.orientation,
            model: {
                uri: this.spoilerUri,
                minimumPixelSize: 128,
                show: true // Keep it TRUE so we can find it
            }
        });
        console.log("SPOILER MODULE: Entity added to viewer");
    }

    update(parentPosition, parentOrientation, isBraking) {
        if (!this.spoilerEntity) return;

        // This should show up constantly in your console
        console.log("SPOILER MODULE: Updating... B-Key State:", isBraking);

        const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(parentPosition);
        const offset = new Cesium.Cartesian3(0, 0, 5.0); // 5 meters up
        const finalPos = Cesium.Matrix4.multiplyByPoint(modelMatrix, offset, new Cesium.Cartesian3());

        this.spoilerEntity.position = finalPos;
        this.spoilerEntity.orientation = parentOrientation;
        
        // Force it to stay visible for now
        this.spoilerEntity.model.show = true; 
    }
}
