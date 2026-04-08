export class FlightMultiplayer {
    constructor(viewer, nav, callsign) {
        this.viewer = viewer;
        this.nav = nav;
        this.callsign = callsign.replace(/\s+/g, '-').toLowerCase();
        this.others = {};
        this.connections = {};

        // Use a public PeerJS server
        this.peer = new Peer(this.callsign);

        this.init();
    }

    init() {
        this.peer.on('open', (id) => {
            console.log('Online as: ' + id);
            
            // If we are pilot-2, keep hunting for pilot-1
            if (this.callsign === 'pilot-2') {
                setInterval(() => {
                    if (!this.connections['pilot-1']) {
                        this.connectTo('pilot-1');
                    }
                }, 3000);
            }
        });

        // This triggers when someone ELSE connects to US
        this.peer.on('connection', (conn) => {
            console.log("Inbound connection from: " + conn.peer);
            this.setupConnection(conn);
        });

        this.peer.on('error', (err) => {
            console.warn("PeerJS Error:", err.type);
        });
    }

    connectTo(targetId) {
        const conn = this.peer.connect(targetId);
        this.setupConnection(conn);
    }

    setupConnection(conn) {
        conn.on('open', () => {
            console.log("Data channel open with: " + conn.peer);
            this.connections[conn.peer] = conn;
        });

        conn.on('data', (data) => {
            this.updateEntity(data);
            this.nav.updateRemotePlayer(data.id, data.pos.lat, data.pos.lon, data.callsign, data.pos.alt);
        });

        conn.on('close', () => this.removePlayer(conn.peer));
    }

    updateEntity(data) {
        if (!this.others[data.id]) {
            // Create the visible plane for the other pilot
            this.others[data.id] = this.viewer.entities.add({
                name: data.callsign,
                model: { 
                    uri: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF/CesiumMilkTruck.glb', 
                    scale: 15,
                    minimumPixelSize: 100 // Makes it visible from far away
                },
                label: { 
                    text: data.callsign, 
                    font: 'bold 16pt monospace', 
                    fillColor: Cesium.Color.YELLOW,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 3,
                    pixelOffset: new Cesium.Cartesian2(0, -70),
                    eyeOffset: new Cesium.Cartesian3(0, 0, -10)
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
        delete this.connections[id];
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
