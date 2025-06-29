import { createWorker } from "mediasoup";

const peers = new Map(); // socket.id => { transport, producer }

export async function setupMediasoup(io) {
    const worker = await createWorker();
    const router = await worker.createRouter({
        mediaCodecs: [{
            kind: "audio",
            mimeType: "audio/opus",
            clockRate: 48000,
            channels: 2
        }]
    });

    io.on("connection", socket => {
        socket.on("create-transport", async callback => {
            const transport = await router.createWebRtcTransport({
                listenIps: [{ ip: "0.0.0.0" }],
                enableUdp: true,
                enableTcp: true,
                preferUdp: true
            });

            peers.set(socket.id, { transport });

            callback({
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters
            });
        });

        socket.on("connect-transport", async ({ dtlsParameters }) => {
            const peer = peers.get(socket.id);
            if (peer?.transport) {
                await peer.transport.connect({ dtlsParameters });
            };
        });

        socket.on("produce", async ({ kind, rtpParameters }, callback) => {
            const peer = peers.get(socket.id);
            if (!peer?.transport) return;

            const producer = await peer.transport.produce({
                kind,
                rtpParameters
            });

            peer.producer = producer;

            callback({ id: producer.id });

            socket.broadcast.emit("new-producer", { id: socket.id });
        });

        socket.on("consume", async ({ producerId, rtpCapabilities }, callback) => {
            if (!router.canConsume({ producerId, rtpCapabilities })) {
                return callback({ error: "Cannot consume stream" });
            };

            const transport = peers.get(socket.id)?.transport;
            const consumer = await transport.consume({
                producerId,
                rtpCapabilities,
                paused: false
            });

            consumer.on("transportclose", () => consumer.close());

            callback({
                id: consumer.id,
                producerId,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters
            });
        });

        socket.on("disconnect", () => {
            const peer = peers.get(socket.id);
            if (peer?.producer) peer.producer.close();
            if (peer?.transport) peer.transport.close();
            peers.delete(socket.id);
        });
    });

    console.log("mediasoup: Worker and router initialized");
};