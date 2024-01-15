import { useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";

const URL = "ws://localhost:3000";

export const Room = (
    {
        name,
        interests,
        localAudioTrack,
        localVideoTrack
    }: {
        name: string,
        interests: string,
        localAudioTrack: MediaStreamTrack | null,
        localVideoTrack: MediaStreamTrack | null
    }) => {
    const [lobby, setLobby] = useState(true);
    const [socket, setSocket] = useState<null | Socket>(null);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<{message: string, sender: string}[]>([]);
    const [currentMessage, setCurrentMessage] = useState("");
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    // Track state for WebRTC
    const sendingPc = useRef<RTCPeerConnection | null>(null);
    const receivingPc = useRef<RTCPeerConnection | null>(null);

    useEffect(() => {
        const socket = io(URL)

        socket.on('connect', () => {
            socket.emit("join", {
                name,
                interests: interests.split(',').map((i: string) => i.trim().toLowerCase()).filter((i: string) => i !== "")
            })
        })

        socket.on('send-offer', async ({ roomId }) => {
            setRoomId(roomId);
            setLobby(false);
            const pc = new RTCPeerConnection();
            sendingPc.current = pc;
            
            if(localVideoTrack) pc.addTrack(localVideoTrack);
            if(localAudioTrack) pc.addTrack(localAudioTrack);

            pc.onicecandidate = async (e) => {
                if(e.candidate) {
                    socket.emit('add-ice-candidate', {
                        candidate: e.candidate,
                        type: 'sender',
                        roomId
                    });
                }
            }

            pc.onnegotiationneeded = async () => {
                const sdp = await pc.createOffer();
                pc.setLocalDescription(sdp);
                socket.emit("offer", { sdp, roomId });
            }
        })

        socket.on('offer', async ({ roomId, sdp: remoteSdp }) => {
            setRoomId(roomId);
            setLobby(false);
            const pc = new RTCPeerConnection();
            receivingPc.current = pc;
            pc.setRemoteDescription(remoteSdp);
            const sdp = await pc.createOffer();
            pc.setLocalDescription(sdp);
            
            const stream = new MediaStream();
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
            
            pc.ontrack = (e) => {
                const { track } = e;
                //@ts-ignore
                remoteVideoRef.current?.srcObject?.addTrack(track);
                //@ts-ignore
                remoteVideoRef.current?.play();
            };

            pc.onicecandidate = async (e) => {
                if(e.candidate) {
                    socket.emit('add-ice-candidate', {
                        candidate: e.candidate,
                        type: 'receiver',
                        roomId
                    });
                }
            }

            socket.emit("answer", { roomId, sdp });
        })

        socket.on("answer", ({ sdp:RemoteSdp }) => {
            setLobby(false);
            sendingPc.current?.setRemoteDescription(RemoteSdp);
        })

        socket.on("lobby", () => {
            setLobby(true);
            setRoomId(null);
            setMessages([]);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            sendingPc.current?.close();
            receivingPc.current?.close();
        });

        socket.on("add-ice-candidate", ({candidate, type}) => {
            if(type === "sender") {
                receivingPc.current?.addIceCandidate(candidate);
            } else {
                sendingPc.current?.addIceCandidate(candidate);
            }
        })

        socket.on("message", ({ message }) => {
            setMessages(m => [...m, { message, sender: "Stranger" }]);
        });

        setSocket(socket)

        return () => {
            socket.disconnect();
        }
    }, [name, interests])

    useEffect(() => {
        if(localVideoRef.current && localVideoTrack) {
            localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
            localVideoRef.current.play();
        }
    }, [localVideoRef, localVideoTrack])

    const onNext = () => {
        if (socket && roomId) {
            socket.emit("skip", { roomId });
            setLobby(true);
            setRoomId(null);
            setMessages([]);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#0f172a", color: "white", padding: "20px", fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, background: "linear-gradient(to right, #38bdf8, #fb7185)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Omegle Clone</h2>
                <button 
                    onClick={onNext}
                    style={{ padding: "10px 24px", borderRadius: "8px", border: "none", backgroundColor: "#fb7185", color: "white", fontWeight: "bold", cursor: "pointer" }}
                >
                    Next (Esc)
                </button>
            </div>

            <div style={{ display: "flex", gap: "20px", flex: 1, minHeight: 0 }}>
                {/* Videos Section */}
                <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ flex: 1, position: "relative", backgroundColor: "#1e293b", borderRadius: "16px", overflow: "hidden", border: "2px solid #334155" }}>
                        <video autoPlay width="100%" height="100%" ref={remoteVideoRef} style={{ objectFit: "cover" }} />
                        <div style={{ position: "absolute", bottom: "15px", left: "15px", background: "rgba(15, 23, 42, 0.7)", padding: "6px 14px", borderRadius: "8px", fontSize: "0.875rem" }}>Stranger</div>
                        {lobby && (
                            <div style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(15, 23, 42, 0.8)", zIndex: 10 }}>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ width: "40px", height: "40px", border: "4px solid #38bdf8", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 15px" }}></div>
                                    <p style={{ color: "#94a3b8" }}>Looking for someone with similar interests...</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div style={{ height: "200px", width: "300px", position: "absolute", bottom: "40px", right: "40px", backgroundColor: "#1e293b", borderRadius: "12px", overflow: "hidden", border: "2px solid #38bdf8", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", zIndex: 20 }}>
                        <video autoPlay width="100%" height="100%" ref={localVideoRef} style={{ objectFit: "cover" }} />
                        <div style={{ position: "absolute", bottom: "10px", left: "10px", background: "rgba(15, 23, 42, 0.7)", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem" }}>You</div>
                    </div>
                </div>

                {/* Chat Section */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#1e293b", borderRadius: "16px", border: "2px solid #334155", overflow: "hidden" }}>
                    <div style={{ padding: "15px", borderBottom: "1px solid #334155", backgroundColor: "#1e293b" }}>
                        <h3 style={{ margin: 0, fontSize: "1rem" }}>Chat</h3>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", padding: "15px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {messages.length === 0 && <p style={{ color: "#64748b", textAlign: "center", marginTop: "20px" }}>Say hi!</p>}
                        {messages.map((m, i) => (
                            <div key={i} style={{ alignSelf: m.sender === "You" ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                                <div style={{ 
                                    padding: "10px 14px", 
                                    borderRadius: "12px", 
                                    backgroundColor: m.sender === "You" ? "#38bdf8" : "#334155",
                                    color: m.sender === "You" ? "#0f172a" : "white",
                                    fontSize: "0.9375rem"
                                }}>
                                    {m.message}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px", textAlign: m.sender === "You" ? "right" : "left" }}>{m.sender}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ padding: "15px", borderTop: "1px solid #334155", display: "flex", gap: "10px" }}>
                        <input 
                            type="text" 
                            value={currentMessage}
                            onChange={(e) => setCurrentMessage(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === "Enter" && currentMessage && roomId) {
                                    socket?.emit("message", { message: currentMessage, roomId });
                                    setMessages(m => [...m, { message: currentMessage, sender: "You" }]);
                                    setCurrentMessage("");
                                }
                            }}
                            placeholder="Type a message..."
                            style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", backgroundColor: "#0f172a", color: "white", outline: "none" }}
                        />
                        <button 
                            onClick={() => {
                                if (currentMessage && roomId) {
                                    socket?.emit("message", { message: currentMessage, roomId });
                                    setMessages(m => [...m, { message: currentMessage, sender: "You" }]);
                                    setCurrentMessage("");
                                }
                            }}
                            style={{ padding: "12px", borderRadius: "8px", border: "none", backgroundColor: "#38bdf8", color: "#0f172a", fontWeight: "bold", cursor: "pointer" }}
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
            <style>
                {`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                `}
            </style>
        </div>
    )
}