import { useEffect, useState, useRef, useCallback } from "react";

import { getHealthColor, drawCrosshair, setupCamera } from "./core/misc";
import { useHealthEffect, handleHealthUpdate, reloadTimed } from "./core/logic";
import { useAudioManager } from "./core/audio";
import useWebSocket from "./core/websocket";

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
    const prevHealth = useRef(100);
    const [ healthColor, setHealthColor ] = useState(null);

    // Player Ammo
    const [ ammo, setAmmo ] = useState(33);
    const [ mag_size, setMagSize ] = useState(34);

    // Firing Logic
    const fireRate=80;
    const lastFiringTime = useRef(0);
    const [triggerPulled, setTriggerPulled] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [fireColor, setFireColor] = useState("gray");

    // Enemy Health
    const [ enemyHealth, setEnemyHealth ] = useState(100);
    const prevEnemyHealth = useRef(100);

    // Debugging info
    const [latencyNum, setLatencyNum] = useState(0);
    const [cameraError, setCameraError] = useState(null);
    const [error, setError] = useState(null);

    // lobby info
    const [inputLobbyId, setInputLobbyId] = useState('');
    const [lobbyId, setLobbyId] = useState(null);
    const [lobbyCount, setLobbyCount] = useState(null);
    const [lobbyColor, setLobbyColor] = useState('red');



    // Setup camera and crosshair
    const videoRef = useRef(null);
    const crosshairRef = useRef(null);
    useEffect(() => {
        crosshairRef.current = drawCrosshair(crosshairRef.current);
        setupCamera(videoRef);
    }, []);

    // manage connection with server
    const { isConnected, lastMessage, connect, disconnect, sendMessage } = useWebSocket(window.serverurl);

    // audio manager
    const { loadSound, playSound, resumeAudioContext } = useAudioManager();
    const initSound = () => {
        resumeAudioContext();
        loadSound('shoot', ASSET_PATH+'/sounds/shoot/acr.mp3');
        loadSound('reload', ASSET_PATH+'/sounds/reload/reload.mp3');
        loadSound('hit', ASSET_PATH+'/sounds/hit/hitfast.mp3');
        loadSound('kill', ASSET_PATH+'/sounds/kill/kill.mp3');
        loadSound('dead', ASSET_PATH+'/sounds/dead/aDead.mp3');
    };


    // handle fire button press
    const handlePressStart = useCallback(() => {
        setIsPressed(true);
        shootPressed();
    }, []);
    const handlePressEnd = useCallback(() => {
        setIsPressed(false);
        shootReleased(); 
    }, []);
    function shootPressed(){
        setTriggerPulled(true);
        setFireColor("red");
    }
    function shootReleased(){
        setTriggerPulled(false);
        setFireColor("gray");
    }
    useEffect(() => {
      const handleGlobalMouseUp = () => {
        if (isPressed) {
          handlePressEnd();
        }
      };
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchend', handleGlobalMouseUp);
  
      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('touchend', handleGlobalMouseUp);
      };
    }, [isPressed, handlePressEnd]);
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
                      playSound('shoot');

                      captureAndSendFrame(videoRef.current, sendMessage);
                      if (newammo <= 0){
                          reloadFunction();
                      }
                  }
              }
          }
      }, 10);

      return () => {
          clearInterval(shoot_check_interval);
      }

    }, [triggerPulled, lastFiringTime, ammo]);


















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
        setLobbyColor('green')
        connect(inputLobbyId);
    }

    // handle health and surrounding logic
    useHealthEffect(lastMessage, health, setHealth, prevHealth, enemyHealth, setEnemyHealth, prevEnemyHealth, setHealthColor, playSound, setAmmo, mag_size, setLobbyId, setLobbyCount);

    

    // if reload is triggered handle logic
    function reloadFunction(){
        playSound('reload');
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

        <div>
        <button 
            style={{
            // height: "50px",
            width: "100%",
            height: "20%",
            fontSize: "20px",
            backgroundColor: fireColor,
            userSelect: "none",  // Prevent text selection
            WebkitTouchCallout: "none",  // Prevent callout on long-press (iOS Safari)
            WebkitUserSelect: "none",  // Prevent selection on iOS
            KhtmlUserSelect: "none",  // Prevent selection on old versions of Konqueror browsers
            MozUserSelect: "none",  // Prevent selection on Firefox
            msUserSelect: "none",  // Prevent selection on Internet Explorer/Edge
            WebkitTapHighlightColor: "rgba(0,0,0,0)",  // 
            }}
            onMouseDown={handlePressStart}
            onTouchStart={handlePressStart}
        >
            FIRE
        </button>
        <p>Health: {health}, Enemy Health: {enemyHealth}<br></br> Hit Latency: {latencyNum}, Lobby {lobbyId}:  {lobbyCount}/2 players</p>
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
            <button 
                style={{
                    backgroundColor: lobbyColor,
                }}
                onClick={joinLobby}
                // onTouchStart={joinLobby}
                disabled={!!cameraError}
            >
                Connect to Lobby M5
            </button>
        </div>
        ) : (
        <button onClick={disconnect}>Disconnect, Lobby: {lobbyId}</button>
        )}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button onClick={initSound}>Load Sound</button>
    </div>);
}

export default App;