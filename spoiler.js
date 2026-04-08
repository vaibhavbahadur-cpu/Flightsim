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
                // Scale 0.001 converts your 2300mm TinkerCAD model to 2.3 meters
                scale: 0.001, 
                minimumPixelSize: 1, 
                show: false // Set back to false so it only shows when braking
            }
        });
        console.log("SPOILER MODULE: Entity added to viewer");
    }

    update(parentPosition, parentOrientation, isBraking) {
        if (!this.spoilerEntity) return;

        // Using Matrix math to keep the spoiler bonded to the plane's local coordinates
        const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(parentPosition);
        
        /**
         * OFFSET ADJUSTMENT:
         * x: 12.0  -> Moves the panel 12 meters to the RIGHT (onto the wing)
         * y: -5.0  -> Moves the panel 5 meters BACK (toward the tail)
         * z: 3.5   -> Moves the panel 3.5 meters UP (to sit on top of the wing)
         */
        const xOffset = 12.0; 
        const yOffset = -5.0; 
        const zOffset = 3.5;  

        const offset = new Cesium.Cartesian3(xOffset, yOffset, zOffset); 
        const finalPos = Cesium.Matrix4.multiplyByPoint(modelMatrix, offset, new Cesium.Cartesian3());

        this.spoilerEntity.position = finalPos;
        this.spoilerEntity.orientation = parentOrientation;
        
        // Show the spoiler only when the B key is pressed
        this.spoilerEntity.model.show = isBraking;
        
        if (isBraking) {
            console.log("SPOILERS DEPLOYED: B-Key active");
        }
    }
}
