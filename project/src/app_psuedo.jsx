import { useEffect, useState, useRef } from "react";

import { getHealthColor, drawCrosshair, setupCamera } from "./core/misc";
import { handleHealthUpdate, reloadTimed } from "./core/logic";
import useWebSocket from "./core/ws";

import {captureAndSendFrame} from "./core/image";

import './App.css';

// const ASSET_PATH="./project/dist/assets";
// const ASSET_PATH="./assets";
const ASSET_PATH=window.assetpath
// const AUDIO_FILE = "/sounds/hit/hitfast.mp3";
const AUDIO_FILE = "/sounds/reload/reload.mp3";

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


    const fireRate=80;
    // last firing time
    const lastFiringTime = useRef(0);
    const [triggerPulled, setTriggerPulled] = useState(false);
    const [fireColor, setFireColor] = useState("gray");
    const audioRef = useRef(null);
    const shootSoundRef = useRef(null);

    useEffect(() => {
        audioRef.current = new Audio(ASSET_PATH + AUDIO_FILE);
        shootSoundRef.current = new Audio(ASSET_PATH + "/sounds/shoot/acr.mp3");
    }, []);
        // const audioRef = useRef(new Audio(ASSET_PATH + AUDIO_FILE));
        // const shootSoundRef = useRef(new Audio(ASSET_PATH + "/sounds/shoot/acr.mp3"));



    const loadShootSound = () => {
        console.log("LOADING SHOOT SOUND")
        shootSoundRef.current.load();
        shootSoundRef.current.play().then(() => {
            shootSoundRef.current.pause();
            shootSoundRef.current.currentTime = 0;
        }).catch(e => {
            console.error('Error loading audio:', e);
        });
    };

    const playShootSound = () => {
        if (shootSoundRef.current.paused) {
            shootSoundRef.current.play().catch(e => {
                console.error('Error playing audio:', e);
            });
        } else {
            shootSoundRef.current.currentTime = 0;
        }
    };

    const loadSound = () => {

        console.log("LOADING SOUND")
        audioRef.current.load();
        audioRef.current.play().then(() => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }).catch(e => {
            console.error('Error loading audio:', e);
        });

        loadShootSound();
    };

    const playSound = () => {
        if (audioRef.current.paused) {
          audioRef.current.play().catch(e => {
            console.error('Error playing audio:', e);
          });
        } else {
          audioRef.current.currentTime = 0;
        }
    };

















    // Setup camera and crosshair
    const videoRef = useRef(null);
    const crosshairRef = useRef(null);
    useEffect(() => {
        crosshairRef.current = drawCrosshair(crosshairRef.current);
        setupCamera(videoRef);
    }, []);


    // manage connection with server
    const { isConnected, lastMessage, connect, disconnect, sendMessage } = useWebSocket(window.serverurl);
    const [lobbyId, setLobbyId] = useState(null);
    // useEffect(() => {
    //     // console.log("IS CONNECTED: ", isConnected, "LM: ", lastMessage);
    //     console.log(lastMessage)
    // // }, [isConnected, lastMessage]);

    function shootPressed(){
        setTriggerPulled(true);
        setFireColor("red");
    }

    function shootReleased(){
        setTriggerPulled(false);
        setFireColor("gray");
    }

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

    // lobby connect
    function joinLobby(){
        connect(inputLobbyId);
    }

    // if health changes handle logic
    useEffect(() => {
        if (lastMessage == null){
            return;
        }
        let health = lastMessage.health;
        let enemyHealth = lastMessage.enemy_health;
        if ((health !=null)&&(enemyHealth !=null)){
            setHealth(health);
            setEnemyHealth(enemyHealth);

            setHealthColor(getHealthColor(health, 100));
            // handleHealthUpdate
            const {hit, death} = handleHealthUpdate(health, enemyHealth, prevEnemyHealth.current);
            if (hit){
                console.log("HIT")
            } else if (death){
                console.log("DEATH")
            }
        }
    }, [lastMessage]);



    // audio manager

    // if fire is triggered handle logic
    // function handleFiring(){
    useEffect(() => {
        let shoot_check_interval = setInterval(() => {
            if (triggerPulled){
                if (Date.now() - lastFiringTime.current >= fireRate){
                    // sendImage();
                    console.log("TIME: ", Date.now() - lastFiringTime.current);
                    lastFiringTime.current = Date.now();
                    if (ammo > 0){
                        const newammo=ammo-1;
                        setAmmo(newammo);
                        playShootSound();
                        captureAndSendFrame(videoRef.current, sendMessage);
                        if (newammo <= 0){
                            reloadFunction();
                        }
                    }
                    // play sound
                }
            }
        }, 10);

        return () => {
            clearInterval(shoot_check_interval);
        }

    }, [triggerPulled, lastFiringTime, ammo]);


    // if reload is triggered handle logic
    function reloadFunction(){
        playSound();
        reloadTimed(ammo, setAmmo, mag_size);
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
            fontSize: "20px",
            backgroundColor: fireColor
            }}
            onMouseDown={shootPressed} 
            onMouseUp={shootReleased} 
            onTouchStart={shootPressed}
            onTouchEnd={shootReleased}
            onMouseLeave={shootReleased}
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
        <button onClick={loadSound}>Load Sound</button>
    </div>);
}

export default App;