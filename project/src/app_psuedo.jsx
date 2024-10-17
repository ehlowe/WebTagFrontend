import { useEffect, useState, useRef } from "react";

import { getHealthColor, drawCrosshair, setupCamera } from "./core/misc";
import { handleHealthUpdate, reloadTimed } from "./core/logic";
import useWebSocket from "./core/ws";

import './App.css';


function App(){
    // Player Health
    const [ health, setHealth ] = useState(100);
    const [ healthColor, setHealthColor ] = useState(null);

    // Player Ammo
    const [ ammo, setAmmo ] = useState(33);
    const [ mag_size, setMagSize ] = useState(34);

    // Enemy Health
    const [ enemyHealth, setEnemyHealth ] = useState(100);
    const prevEnemyHealth = useRef(100);

    // Debugging info
    const [latencyNum, setLatencyNum] = useState(0);
    const [cameraError, setCameraError] = useState(null);
    const [error, setError] = useState(null);


    // lobby info
    const [inputLobbyId, setInputLobbyId] = useState('');















    // Setup camera and crosshair
    const videoRef = useRef(null);
    const crosshairRef = useRef(null);
    useEffect(() => {
        crosshairRef.current = drawCrosshair(crosshairRef.current);
        setupCamera(videoRef);
    }, []);


    // manage connection with server
    const { isConnected, lastMessage, connect, disconnect, sendMessage } = useWebSocket();
    const [lobbyId, setLobbyId] = useState(null);
    // useEffect(() => {
    //     // console.log("IS CONNECTED: ", isConnected, "LM: ", lastMessage);
    //     console.log(lastMessage)
    // }, [isConnected, lastMessage]);

    // periodically send data to server
    useEffect(() => {
        const interval = setInterval(() => {
            if (isConnected) {
                sendMessage({ data: "1234567891011121314151617181920" });
            }
        }, 50);

        return () => {
            clearInterval(interval);
        }
    }, [isConnected]);


    // audio manager

    // if fire is triggered handle logic


    // if reload is triggered handle logic
    function reloadFunction(){
        reloadTimed(ammo, setAmmo, mag_size);
    }

    // if health changes handle logic
    useEffect(() => {
        setHealthColor(getHealthColor(health, 100));
        // handleHealthUpdate
        const {hit, death} = handleHealthUpdate(health, enemyHealth, prevEnemyHealth.current);
        if (hit){
            console.log("HIT")
        } else if (death){
            console.log("DEATH")
        }
    }, [health]);

    // lobby connect
    function joinLobby(){
        connect(inputLobbyId);
    }


    // return the display of the app with all its components
    return(<div className="App" style={{ position: 'relative', width: '320px', height: '440px', backgroundColor: healthColor }}>
        <button 
        style={{
            position: "absolute",
            // height: "50px",
            width: "100%",
            height: "10%",
            fontSize: "20px",
            zIndex: 1
        }}
        onMouseDown={reloadFunction}
        onTouchStart={reloadFunction}
        // disabled={!connected || !!cameraError}
        >
        RELOAD {ammo}/{mag_size}
        </button>
        <video ref={videoRef} autoPlay playsInline style={{ width: '320px', height: '440px' }} />
        <canvas 
        ref={crosshairRef} 
        width="320" 
        height="440" 
        style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
        }} 
        />
        {/* <canvas ref={canvasRef} style={{ display: 'none' }} /> */}

        <div>
        <button 
            style={{
            // height: "50px",
            width: "100%",
            height: "20%",
            fontSize: "20px"
            }}
            // onMouseDown={handleButtonPress} 
            // onMouseUp={handleButtonRelease} 
            // onTouchStart={handleButtonPress}
            // onTouchEnd={handleButtonRelease}
            // onMouseLeave={handleButtonRelease}
            // disabled={!connected || !!cameraError}
        >
            FIRE
        </button>
        <p>Health: {health}, Enemy Health: {enemyHealth}<br></br> Hit Latency: {latencyNum}</p>
        </div>
        {!isConnected ? (
        <div>
            <input
            type="number"
            value={inputLobbyId || ''}
            onChange={(e) => setInputLobbyId(e.target.value)}
            placeholder="Enter lobby ID (optional)"
            style={{ border: '1px solid #ccc', padding: '0.5rem', marginRight: '0.5rem' }}
            />
            <button onClick={joinLobby} disabled={!!cameraError}>Connect to Lobby M4</button>
        </div>
        ) : (
        <button onClick={disconnect}>Disconnect, Lobby: {lobbyId}</button>
        )}
        {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>);
}

export default App;