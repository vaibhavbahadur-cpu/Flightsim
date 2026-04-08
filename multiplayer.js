export class FlightMultiplayer {
    constructor(viewer, nav, callsign) {
        this.viewer = viewer;
        this.nav = nav;
        this.callsign = callsign.replace(/\s+/g, '-').toLowerCase();
        this.others = {};
        this.connections = {};

        // 1. Initialize Peer with your callsign
        this.peer = new Peer(this.callsign);

        this.init();
    }

    init() {
        this.peer.on('open', (id) => {
            console.log('Online as: ' + id);
            // AUTO-DISCOVERY: Try to find a partner if you are pilot-2
            if (this.callsign.includes('2')) {
                this.connectTo('pilot-1');
            } else if (this.callsign.includes('1')) {
                this.connectTo('pilot-2');
            }
        });

        // Handle incoming connections
        this.peer.on('connection', (conn) => {
            this.setupConnection(conn);
        });
    }

    connectTo(targetId) {
        console.log("Attempting to find " + targetId + "...");
        const conn = this.peer.connect(targetId);
        this.setupConnection(conn);
    }

    setupConnection(conn) {
        conn.on('open', () => {
            console.log("Connected to: " + conn.peer);
            this.connections[conn.peer] = conn;
        });

        conn.on('data', (data) => {
            this.updateEntity(data);
            // Update the Nav Map Radar
            this.nav.updateRemotePlayer(
                data.id, 
                data.pos.lat, 
                data.pos.lon, 
                data.callsign, 
                data.pos.alt
            );
        });

        conn.on('close', () => this.removePlayer(conn.peer));
        conn.on('error', () => this.removePlayer(conn.peer));
    }

    updateEntity(data) {
        if (!this.others[data.id]) {
            this.others[data.id] = this.viewer.entities.add({
                name: data.callsign,
                model: { 
                    uri: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF/CesiumMilkTruck.glb', 
                    scale: 10 
                },
                label: { 
                    text: data.callsign, 
                    font: '14pt monospace', 
                    fillColor: Cesium.Color.YELLOW,
                    outlineWidth: 2,
                    pixelOffset: new Cesium.Cartesian2(0, -60)
                }
            });
        }
        const pos = Cesium.Cartesian3.fromDegrees(data.pos.lon, data.pos.lat, data.pos.alt);
        this.others[data.id].position = pos;
        
        const hpr = new Cesium.HeadingPitchRoll(
            Cesium.Math.toRadians(data.hpr.h - 90),
            Cesium.Math.toRadians(data.hpr.p),
            Cesium.Math.toRadians(data.hpr.r)
        );
        this.others[data.id].orientation = Cesium.Transforms.headingPitchRollQuaternion(pos, hpr);
    }

    removePlayer(id) {
        if (this.others[id]) {
            this.viewer.entities.remove(this.others[id]);
            delete this.others[id];
        }
        this.nav.removeRemotePlayer(id);
    }

    send(lat, lon, alt, h, p, r) {
        const payload = {
            id: this.callsign,
            callsign: this.callsign,
            pos: { lat, lon, alt },
            hpr: { h, p, r }
        };

        for (let id in this.connections) {
            if (this.connections[id].open) {
                this.connections[id].send(payload);
            }
        }
    }
}
