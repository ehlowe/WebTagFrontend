
// Basic React Import
import { useEffect, useState, useRef, useCallback } from "react";
import React from "react";
import ReactDOM from "react-dom";
import QRCode from "react-qr-code";

// Styles
import './App.css';



// Custom Components
// Core Logic
import { useHealthEffect, handleHealthUpdate } from "./core/logic";
import useFiringDetection, { reloadFunction } from "./core/logic/firing";


// Core Audio
import { useAudioManager } from "./core/audio";

// Core WebSocket
import useWebSocket, { usePeriodicSend } from "./core/websocket";

// Core Router
import { useServerRouter } from "./core/router";

// Core Visibility
import { handleVisibilityChange } from "./core/visibility";

// Core Image
import {useImgZoomer, captureAndSendFrame, drawCrosshair, setupCamera, stopCam, useCamera} from "./core/image";
import useEnemyBar from "./core/enemybar";
// Core Misc
import { useGetQueryParams } from "./core/misc";


// Popups and Logger
import CameraSelector from "./core/popups/camera_switch_popup";
import CreditsPopup from "./core/popups/sfx_credits";
import { useConsoleLogger } from "./core/console_logger";





// const ASSET_PATH="./project/dist/assets";
// const ASSET_PATH="./assets";
const ASSET_PATH=window.assetpath
// const AUDIO_FILE = "/sounds/hit/hitfast.mp3";
const AUDIO_FILE = "/sounds/reload/reload.mp3";

// const audioRef = useRef(new Audio("./assets" + "/sounds/hit/hitfast.mp3"));



function App(){
    // Player Stats
    const [k, setK]=useState(0);
    const [d, setD]=useState(0);

    // Player Health
    const [ health, setHealth ] = useState(100);
    const prevHealth = useRef(100);
    const [ healthColor, setHealthColor ] = useState(null);

    // Player Ammo
    const [ ammo, setAmmo ] = useState(20);
    const [ mag_size, setMagSize ] = useState(20);
    const [ inReload, setInReload ] = useState(false);

    // Firing Logic
    // const fireRate=74;
    const fireRate=30;

    const reload_time=3.5;
    //const fireRate=85;

    const [zoomedMode, setZoomedMode] = useState(false);
    const cameraIndex = useRef(null);

    // Enemy Health
    const [ enemyHealth, setEnemyHealth ] = useState(100);
    const prevEnemyHealth = useRef(100);

    // Debugging info
    const [latencyNum, setLatencyNum] = useState(0);
    const [cameraError, setCameraError] = useState(null);
    const [error, setError] = useState(null);

    // lobby info
    const [lobbyId, setLobbyId] = useState(null);
    const [lobbyCount, setLobbyCount] = useState(null);
    const [lobbyColor, setLobbyColor] = useState('red');








    // get query params
    const [inputLobbyId, setInputLobbyId] = useGetQueryParams();



    // // IMAGE
    const videoRef = useRef(null);
    const crosshairRef = useRef(null);
    const { cameras, selectedCamera, setSelectedCamera } = useCamera(videoRef, crosshairRef);

    // handle zooming image
    const zoomedCanvas = useImgZoomer(videoRef, zoomedMode);
    
    // handle visibility change
    const prevVisibility = useRef(document.visibilityState);
    document.addEventListener('visibilitychange', () => handleVisibilityChange(videoRef, cameras, prevVisibility));

    // handle console visibility
    const [isVisible, setIsVisible] = useState(false);
    const { logs, clearLogs } = useConsoleLogger();




    // // CONNECTIONS
    // manage connection with server
    const { isConnected, lastMessage, connect, disconnect, sendMessage, wss_url } = useWebSocket(window.serverurl, setLobbyId, setLobbyCount);

    // Handle connection polling
    const { isPolling, setIsPolling, serverInfo} = useServerRouter(wss_url, connect, inputLobbyId);

    // Update joinLobby to trigger polling
    function joinLobbyRequest() {
      initSound();
      setIsPolling(true);

      // // if testing
      // setIsPolling(false);
      // connect(inputLobbyId);
    }

    // periodically send data to server
    usePeriodicSend(isConnected, sendMessage);




   

    // AUDIO
    const { loadSound, playSound, resumeAudioContext, initSound } = useAudioManager();



    // // GAME LOGIC
    // handle firing and trigger logic
    const { isPressed, triggerPulled, fireColor, lastFiringTime, setIsPressed, shootPressed } = useFiringDetection(ammo, setAmmo, reload_time, mag_size, fireRate, playSound, health, sendMessage, videoRef);

    function handlePressStart(){
      setIsPressed(true);
      shootPressed();
    }

    // handle health and surrounding logic
    useHealthEffect(lastMessage, health, setHealth, prevHealth, enemyHealth, setEnemyHealth, prevEnemyHealth, setHealthColor, playSound, setAmmo, mag_size, setLobbyId, setLobbyCount, setK, setD, setLatencyNum, lastFiringTime);



    const ctx = useRef(null);
    const enemyBarContext = ctx.current?.getContext('2d');
    const [enemyPosition, setEnemyPosition] = useState({x: 100, y: 50});
    useEnemyBar(ctx, enemyBarContext, enemyPosition, enemyHealth, lastMessage);







    // // if the screen is turned off close everything and stop camera
    // useEffect(() => {
    //   const handleVisibilityChange = () => {
    //     if (document.hidden) {
    //       // Stop all tracks in your video/audio stream
    //       if (yourStreamRef.current) {
    //         yourStreamRef.current.getTracks().forEach(track => track.stop());
    //       }
    //     }
    //   };
    
    //   document.addEventListener("visibilitychange", handleVisibilityChange);
    
    //   // Cleanup
    //   return () => {
    //     document.removeEventListener("visibilitychange", handleVisibilityChange);
    //   };
    // }, []);




    // return the display of the app with all its components
    return(<div className="App" style={{ position: 'relative',left: '5%', justifyContent: 'center' ,width: '90%', height: '440px', backgroundColor: healthColor ,
      userSelect: "none",  // Prevent text selection
      WebkitTouchCallout: "none",  // Prevent callout on long-press (iOS Safari)
      WebkitUserSelect: "none",  // Prevent selection on iOS
      KhtmlUserSelect: "none",  // Prevent selection on old versions of Konqueror browsers
      MozUserSelect: "none",  // Prevent selection on Firefox
      msUserSelect: "none",  // Prevent selection on Internet Explorer/Edge
      WebkitTapHighlightColor: "rgba(0,0,0,0)",  //  */
    }}>
        <button 
        style={{
            // position: "absolute",
            // height: "50px",
            position: 'relative',
            padding: 0, margin: 0,
            width: "100%",
            height: "10%",
            fontSize: "20px",
            zIndex: 10,
            top: '5%',
        }}
        onMouseDown={()=>reloadFunction(inReload, ammo, setAmmo, mag_size, playSound, setInReload, reload_time)}
        onTouchStart={()=>reloadFunction(inReload, ammo, setAmmo, mag_size, playSound, setInReload, reload_time)}
        >
        RELOAD {ammo}/{mag_size}
        </button>
        <div style={{height: 'auto' , position: 'relative', top: '0%', height: '80%', padding: 0, margin: 0}}>

          <div style={{position: 'absolute', padding: "5px", right: '0px', color: 'black'}}>
            <h2 style={{
              userSelect: "none",  // Prevent text selection
              WebkitTouchCallout: "none",  // Prevent callout on long-press (iOS Safari)
              WebkitUserSelect: "none",  // Prevent selection on iOS
              KhtmlUserSelect: "none",  // Prevent selection on old versions of Konqueror browsers
              MozUserSelect: "none",  // Prevent selection on Firefox
              msUserSelect: "none",  // Prevent selection on Internet Explorer/Edge
            }}
            >K: {k}, D: {d}</h2>
          </div>
          <div style={{position: 'absolute', padding: "5px", right: '0px', color: 'black', top: "10%"}}>
            {(lobbyCount==1)?
                <h2 style={{
                  userSelect: "none",  // Prevent text selection
                  WebkitTouchCallout: "none",  // Prevent callout on long-press (iOS Safari)
                  WebkitUserSelect: "none",  // Prevent selection on iOS
                  KhtmlUserSelect: "none",  // Prevent selection on old versions of Konqueror browsers
                  color: "green",
                  MozUserSelect: "none",  // Prevent selection on Firefox
                  msUserSelect: "none",  // Prevent selection on Internet Explorer/Edge
                }}
                >Show QR Code to 2nd player</h2>
                :null
              }
          </div>
          <video ref={videoRef} autoPlay playsInline 
          style={{ 
            width: "100%",
            width: '100%', 
            height: '100%', 
            userSelect: "none",  // Prevent text selection
            WebkitTouchCallout: "none",  // Prevent callout on long-press (iOS Safari)
            WebkitUserSelect: "none",  // Prevent selection on iOS
            KhtmlUserSelect: "none",  // Prevent selection on old versions of Konqueror browsers
            MozUserSelect: "none",  // Prevent selection on Firefox
            msUserSelect: "none",  // Prevent selection on Internet Explorer/Edge
            zIndex: -10000,
          }}
          />
          <canvas 
            ref={crosshairRef} 
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1,
                userSelect: "none",  // Prevent text selection
                WebkitTouchCallout: "none",  // Prevent callout on long-press (iOS Safari)
                WebkitUserSelect: "none",  // Prevent selection on iOS
                KhtmlUserSelect: "none",  // Prevent selection on old versions of Konqueror browsers
                MozUserSelect: "none",  // Prevent selection on Firefox
                msUserSelect: "none",  // Prevent selection on Internet Explorer/Edge
            }} 
          />
          <canvas ref={ctx} 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 1,
              userSelect: "none",  // Prevent text selection
              WebkitTouchCallout: "none",  // Prevent callout on long-press (iOS Safari)
              WebkitUserSelect: "none",  // Prevent selection on iOS
              KhtmlUserSelect: "none",  // Prevent selection on old versions of Konqueror browsers
              MozUserSelect: "none",  // Prevent selection on Firefox
              msUserSelect: "none",  // Prevent selection on Internet Explorer/Edge
          }} />
          {/* If not connected to a lobby display a banner telling user to connect to a lobby */}
          {!isConnected && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              // backgroundColor: 'rgba(45, 45, 45, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 2000
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '1rem',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                  <h2 style={{ margin: 0, marginBottom: '1rem', zIndex: 1000, color: "black" }}>{(inputLobbyId==null)?"Connect to Lobby with button below": "Click 'Join Lobby' below to connect to lobby: "+inputLobbyId}</h2>
                  <p style={{ margin: 0 , zIndex: 1000, color: "black" }}>This enables audio and connects you to the server, join a friend's lobby number to play with them</p>
              </div>
            </div>
          )}
        </div>


        {/* <canvas ref={zoomedCanvas} 
        width="320" 
        height="440" 
        zIndex="10000"
        style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
        }} /> */}

        {/* {
          zoomedMode ?
          <canvas ref={zoomedCanvas} autoPlay playsInline style={{ width: '320px', height: '440px' }}/>
          :<video ref={videoRef} autoPlay playsInline style={{ width: '320px', height: '440px' }} />

        } */}

        <div>
          <button 
              style={{
              // height: "50px",
              width: "100%",
              height: "20%",
              fontSize: "20px",
              position: "relative",
              top: '100%',
              backgroundColor: fireColor,
              userSelect: "none",  // Prevent text selection
              WebkitTouchCallout: "none",  // Prevent callout on long-press (iOS Safari)
              WebkitUserSelect: "none",  // Prevent selection on iOS
              KhtmlUserSelect: "none",  // Prevent selection on old versions of Konqueror browsers
              MozUserSelect: "none",  // Prevent selection on Firefox
              msUserSelect: "none",  // Prevent selection on Internet Explorer/Edge
              WebkitTapHighlightColor: "rgba(0,0,0,0)",  // 
              zIndex: 10,
              }}
              onMouseDown={handlePressStart}
              onTouchStart={handlePressStart}
          >
              FIRE
          </button>
          <button 
              style={{
              // height: "50px",
              width: "100%",
              height: "90%",
              fontSize: "20px",
              position: "absolute",
              top: '10%',
              left: '0%',
              opacity: 0.0,
              zIndex: 5,
              // backgroundColor: fireColor,
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
          />

          <p>Health: {health}, Enemy Health: {enemyHealth}<br></br> Hit Latency: {latencyNum}, Lobby {lobbyId}, {lobbyCount}/2 players</p>
        </div>
        {!isConnected ? (
        <div>
            <input
              type="number"
              value={inputLobbyId}
              onChange={(e) => setInputLobbyId(e.target.value)}
              placeholder="Enter lobby ID (optional)"
              style={{ border: '1px solid #ccc', padding: '0.5rem', marginRight: '0.5rem' ,zIndex: 10, position: 'relative', top: '0%', width: '60%'}}
            />
            <button 
                style={{
                    backgroundColor: lobbyColor,
                    width: '60%',
                    zIndex: 10,
                    position: 'relative',
                }}
                onClick={joinLobbyRequest}
                // onTouchStart={joinLobby}
                disabled={!!cameraError}
            >
                {/* {(isPolling)?(serverInfo!={})?"Connecting to server": "Server Status: "+serverInfo.status:(inputLobbyId=="")?"Connect to Lobby": "Join Lobby"} */}
                {(isPolling) ? 
                  (serverInfo!={}) ? 
                    (serverInfo.status !== "RUNNING") ? 
                      `Server Status: ${serverInfo.status} , Ready in ~${serverInfo.booting_time} seconds` 
                      : `Server Status: ${serverInfo.status}, connecting to server...`
                    :"Connecting to server" 
                  : (inputLobbyId=="") ? "Connect to Lobby" : "Join Lobby"}

            </button>
        </div>
        ) : (
          <div >
            <button style={{zIndex: 10, position: "relative"}} onClick={disconnect}>Disconnect, Lobby: {lobbyId}</button>
            {((lobbyId!=null)&&(lobbyCount<2))?
              <div style={{ background: 'white', padding: '16px' , zIndex: 10, position: "relative"}}>
                <QRCode value={(lobbyId!=null)?"https://visiontaglive.com/?lobby_id="+lobbyId:"https://visiontaglive.com/?lobby_id="}/>
                {/* <QRCode value={(lobbyId!=null)?"http://192.168.1.70:5173/?lobby_id="+lobbyId:"http://192.168.1.70:5173/?lobby_id="}/> */}
              </div>
              :null
            }
          </div>
        )}
        <CameraSelector 
          cameras={cameras} 
          onCameraSelect={(index) => {
            cameraIndex.current = index;
            stopCam();
            setupCamera(videoRef, cameras[index].deviceId);
          }} 
        />
        {/* <button onClick={switchCamera}>Wrong Camera? Switch</button> */}
        {/* <CameraSelector
          cameras={cameras}
          cameraIndex={cameraIndex}
          stopCam={stopCam}
          setupCamera={setupCamera}
          videoRef={videoRef}
        /> */}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {/* <button onClick={initSound}>Load Sound</button> */}
        {/* <div style={{position: "absolute", bottom: '-200px', left: 0}}>
          <button style={{padding: '0px'}}>SFX<br></br>Credits</button>
        </div> */}
        <CreditsPopup />



        {/* DEBUGGING MOBILE */}
        <button style={{zIndex: 10, position: "relative"}}
            onClick={() => setIsVisible(!isVisible)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
          {isVisible ? 'Hide Console' : 'Show Console'}
        </button>
        {/* <button onClick={() => loadSoundFS()}>
          Load Sound 1
        </button>
        <button onClick={() => initSound()}>
          Load Sound 2
        </button> */}
        {isVisible && (
          <div className="border rounded-lg shadow-lg bg-gray-900 text-white p-4 max-h-96 overflow-y-auto font-mono">
            {logs.length === 0 ? (
              <div className="text-gray-400">No console logs yet...</div>
            ) : (
              logs.map(log => (
                <div
                  key={log.id}
                  className={`py-1 ${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'warn' ? 'text-yellow-400' :
                    log.type === 'info' ? 'text-blue-400' :
                    log.type === 'debug' ? 'text-gray-400' :
                    'text-white'
                  }`}
                >
                  <span className="text-gray-500 text-sm">{log.timestamp}</span>
                  {' '}
                  <span className="text-gray-400">[{log.type}]</span>
                  {' '}
                  {log.content}
                </div>
              ))
            )}
          </div>
        )}
        
    </div>);
}

export default App;