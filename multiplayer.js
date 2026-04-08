export class FlightMultiplayer {
    constructor(viewer, nav, callsign) {
        this.viewer = viewer;
        this.nav = nav;
        // Your unique ID (random or chosen)
        this.id = callsign.replace(/\s+/g, '-').toLowerCase() + "-" + Math.floor(Math.random() * 1000);
        this.callsign = callsign;
        this.others = {};
        this.connections = {};

        // 1. Create the UI HUD
        this.statusDiv = document.createElement('div');
        this.statusDiv.style.cssText = "position:absolute; top:10px; right:10px; padding:10px; background:rgba(0,0,0,0.8); color:#0f0; font-family:monospace; z-index:10005; border:1px solid #0f0; border-radius:5px;";
        document.body.appendChild(this.statusDiv);

        // 2. Start PeerJS
        this.peer = new Peer(this.id);
        this.init();
    }

    init() {
        this.peer.on('open', (myId) => {
            this.statusDiv.innerHTML = `CALLSIGN: ${this.callsign}<br>RADAR: SCANNING...`;
            
            // DISCOVERY LOGIC:
            // We "broadcast" our ID to a public list so others can find us.
            // Since PeerJS doesn't have a built-in "Lobby List", 
            // we try to connect to a few common 'slots' (slot-1, slot-2, etc.)
            for (let i = 1; i <= 5; i++) {
                this.tryConnect(`b748-slot-${i}`);
            }

            // Also, we try to BECOME a slot if it's empty
            this.occupySlot();
        });

        this.peer.on('connection', (conn) => {
            this.setupConnection(conn);
        });
    }

    async occupySlot() {
        // Try to take a slot so others can find us easily
        for (let i = 1; i <= 10; i++) {
            let slotPeer = new Peer(`b748-slot-${i}`);
            slotPeer.on('open', () => {
                console.log(`Taking Slot ${i} as a beacon.`);
                slotPeer.on('connection', (conn) => {
                    // When someone connects to our slot, we tell them our REAL random ID
                    conn.on('open', () => {
                        conn.send({ type: 'HANDSHAKE', realId: this.id });
                    });
                });
            });
            slotPeer.on('error', () => { /* Slot taken, try next */ });
        }
    }

    tryConnect(targetId) {
        if (targetId === this.id) return;
        const conn = this.peer.connect(targetId);
        this.setupConnection(conn);
    }

    setupConnection(conn) {
        conn.on('data', (data) => {
            // If we hit a slot beacon, connect to their real random name
            if (data.type === 'HANDSHAKE') {
                this.tryConnect(data.realId);
                return;
            }

            // Otherwise, it's flight data!
            this.updateEntity(data);
            this.nav.updateRemotePlayer(data.id, data.pos.lat, data.pos.lon, data.callsign, data.pos.alt);
            
            this.connections[conn.peer] = conn;
            this.statusDiv.innerHTML = `CALLSIGN: ${this.callsign}<br>PILOTS NEARBY: ${Object.keys(this.others).length}`;
        });
    }

    updateEntity(data) {
        if (!this.others[data.id]) {
            this.others[data.id] = this.viewer.entities.add({
                name: data.callsign,
                model: { 
                    uri: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF/CesiumMilkTruck.glb', 
                    scale: 20, 
                    minimumPixelSize: 80 
                },
                label: { 
                    text: data.callsign.toUpperCase(), 
                    font: 'bold 16pt monospace', 
                    fillColor: Cesium.Color.YELLOW,
                    pixelOffset: new Cesium.Cartesian2(0, -60),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY 
                }
            });
        }
        const pos = Cesium.Cartesian3.fromDegrees(data.pos.lon, data.pos.lat, data.pos.alt);
        this.others[data.id].position = pos;
        this.others[data.id].orientation = Cesium.Transforms.headingPitchRollQuaternion(pos, 
            new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(data.hpr.h-90), Cesium.Math.toRadians(data.hpr.p), Cesium.Math.toRadians(data.hpr.r)));
    }

    send(lat, lon, alt, h, p, r) {
        const payload = { id: this.id, callsign: this.callsign, pos: { lat, lon, alt }, hpr: { h, p, r } };
        for (let id in this.connections) {
            if (this.connections[id].open) {
                this.connections[id].send(payload);
            }
        }
    }
}
