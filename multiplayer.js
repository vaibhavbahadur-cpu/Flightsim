export class FlightMultiplayer {
    constructor(viewer, nav, callsign) {
        this.viewer = viewer;
        this.nav = nav;
        this.callsign = callsign.replace(/\s+/g, '-').toLowerCase(); // PeerJS needs IDs with no spaces
        this.others = {};
        
        // Connect to the free public PeerJS cloud
        this.peer = new Peer(this.callsign);
        this.connections = {};

        this.init();
    }

    init() {
        this.peer.on('open', (id) => {
            console.log('My flight ID is: ' + id);
        });

        // Listen for incoming "flight data" from other pilots
        this.peer.on('connection', (conn) => {
            this.setupConnection(conn);
        });

        // Optional: Manual connect function (for testing)
        window.connectToPilot = (targetId) => {
            const conn = this.peer.connect(targetId);
            this.setupConnection(conn);
        };
    }

    setupConnection(conn) {
        conn.on('data', (data) => {
            this.updateEntity(data);
            this.nav.updateRemotePlayer(
                data.id, 
                data.pos.lat, 
                data.pos.lon, 
                data.callsign, 
                data.pos.alt
            );
        });
        
        conn.on('close', () => {
            this.removePlayer(conn.peer);
        });
        
        this.connections[conn.peer] = conn;
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
                    font: '12pt monospace', 
                    fillColor: Cesium.Color.YELLOW, 
                    pixelOffset: new Cesium.Cartesian2(0, -50) 
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

        // Send data to everyone we are connected to
        for (let id in this.connections) {
            if (this.connections[id].open) {
                this.connections[id].send(payload);
            }
        }
    }
}
