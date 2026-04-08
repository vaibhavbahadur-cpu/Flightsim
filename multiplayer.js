export class FlightMultiplayer {
    constructor(viewer, nav, callsign) {
        this.viewer = viewer;
        this.nav = nav;
        this.callsign = callsign;
        this.socket = io('http://localhost:3000'); 
        this.others = {};
        this.init();
    }

    init() {
        this.socket.emit('join', { callsign: this.callsign });
        this.socket.on('playerMoved', (data) => {
            this.updateEntity(data);
            this.nav.updateRemotePlayer(data.id, data.pos.lat, data.pos.lon, data.callsign, data.pos.alt);
        });
        this.socket.on('playerLeft', (id) => {
            if (this.others[id]) { this.viewer.entities.remove(this.others[id]); delete this.others[id]; }
            this.nav.removeRemotePlayer(id);
        });
    }

    updateEntity(data) {
        if (!this.others[data.id]) {
            this.others[data.id] = this.viewer.entities.add({
                name: data.callsign,
                model: { uri: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF/CesiumMilkTruck.glb', scale: 10 }, // Replace with your 747 URL
                label: { text: data.callsign, font: '12pt monospace', fillColor: Cesium.Color.YELLOW, pixelOffset: new Cesium.Cartesian2(0, -50) }
            });
        }
        const pos = Cesium.Cartesian3.fromDegrees(data.pos.lon, data.pos.lat, data.pos.alt);
        this.others[data.id].position = pos;
        this.others[data.id].orientation = Cesium.Transforms.headingPitchRollQuaternion(pos, 
            new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(data.hpr.h-90), Cesium.Math.toRadians(data.hpr.p), Cesium.Math.toRadians(data.hpr.r)));
    }

    send(lat, lon, alt, h, p, r) {
        this.socket.emit('updatePosition', { pos: { lat, lon, alt }, hpr: { h, p, r }, callsign: this.callsign });
    }
}
