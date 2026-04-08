import { SpoilerModule } from '../spoiler.js';

export class Boeing748 {
    constructor(viewer) {
        this.viewer = viewer;
        this.modelUri = 'https://raw.githack.com/vaibhavbahadur-cpu/7478/main/Boeing%20747-8I.glb';
        this.aircraftEntity = null;
        this.spoilerSystem = new SpoilerModule(viewer);
    }

    spawn(lon, lat, alt) {
        const position = Cesium.Cartesian3.fromDegrees(lon, lat, alt);
        const hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(170), 0, 0);
        const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

        this.aircraftEntity = this.viewer.entities.add({
            name: 'Boeing 747-8',
            position: position,
            orientation: orientation,
            model: { 
                uri: this.modelUri, 
                minimumPixelSize: 128 
            }
        });

        this.viewer.trackedEntity = this.aircraftEntity;
        this.spoilerSystem.setup(this.aircraftEntity);
    }

    update(data, controls) {
        if (!this.aircraftEntity) return;

        const position = Cesium.Cartesian3.fromDegrees(data.longitude, data.latitude, data.altitude);
        const hpr = new Cesium.HeadingPitchRoll(
            Cesium.Math.toRadians(data.heading),
            Cesium.Math.toRadians(data.pitch),
            Cesium.Math.toRadians(data.roll)
        );
        const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

        this.aircraftEntity.position = position;
        this.aircraftEntity.orientation = orientation;

        // Pass the B key state to the spoiler system
        this.spoilerSystem.update(
            this.aircraftEntity.position, 
            this.aircraftEntity.orientation, 
            controls.keys.KeyB
        );
    }
}
