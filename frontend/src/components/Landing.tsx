import { useEffect, useRef, useState } from "react";
import { Room } from "./Room";

export const Landing = () => {
    const [name, setName] = useState("");
    const [interests, setInterests] = useState("");
    const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [joined, setJoined] = useState(false);

    const getCam = async () => {
        try {
            const stream = await window.navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })

            const audioTrack = stream.getAudioTracks()[0];
            const videoTrack = stream.getVideoTracks()[0];
            setLocalAudioTrack(audioTrack);
            setLocalVideoTrack(videoTrack);
            if (!videoRef.current) {
                return;
            }
            videoRef.current.srcObject = new MediaStream([videoTrack]);
            videoRef.current.play();
        } catch (e) {
            console.error("Error accessing media devices:", e);
        }
    }

    useEffect(() => {
        if (videoRef && videoRef.current) {
            getCam();
        }
    }, [videoRef])

    if (!joined) {
        return (
            <div style={{ 
                height: "100vh", 
                backgroundColor: "#0f172a", 
                color: "white", 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center",
                fontFamily: "'Inter', sans-serif"
            }}>
                <div style={{ maxWidth: "500px", width: "100%", textAlign: "center", padding: "40px", backgroundColor: "#1e293b", borderRadius: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
                    <h1 style={{ fontSize: "2.5rem", marginBottom: "10px", fontWeight: "800", background: "linear-gradient(to right, #38bdf8, #fb7185)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Omegle Clone</h1>
                    <p style={{ color: "#94a3b8", marginBottom: "30px" }}>Connect with strangers instantly.</p>
                    
                    <div style={{ width: "100%", height: "250px", backgroundColor: "#0f172a", borderRadius: "16px", overflow: "hidden", marginBottom: "30px", border: "2px solid #334155" }}>
                        <video autoPlay ref={videoRef} onMouseDown={(e) => e.preventDefault()} style={{ width: "100%", height: "100%", objectFit: "cover" }}></video>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "15px", textAlign: "left" }}>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px", fontSize: "0.875rem", color: "#94a3b8" }}>What's your name?</label>
                            <input 
                                type="text" 
                                placeholder="Enter your name"
                                onChange={(e) => setName(e.target.value)}
                                style={{ width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "white", outline: "none" }}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", marginBottom: "5px", fontSize: "0.875rem", color: "#94a3b8" }}>Interests (optional, comma separated)</label>
                            <input 
                                type="text" 
                                placeholder="Coding, Music, Travel..."
                                onChange={(e) => setInterests(e.target.value)}
                                style={{ width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "white", outline: "none" }}
                            />
                        </div>

                        <button 
                            onClick={() => {
                                if (name) setJoined(true);
                            }}
                            style={{ 
                                marginTop: "10px",
                                width: "100%", 
                                padding: "14px", 
                                borderRadius: "8px", 
                                border: "none", 
                                backgroundColor: "#38bdf8", 
                                color: "#0f172a", 
                                fontWeight: "800", 
                                fontSize: "1rem",
                                cursor: "pointer",
                                transition: "transform 0.2s"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                        >
                            Start Chating
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <Room name={name} interests={interests} localAudioTrack={localAudioTrack} localVideoTrack={localVideoTrack}/>
};
