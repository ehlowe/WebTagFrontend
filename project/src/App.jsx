import { useEffect, useState, useRef, useCallback } from "react";

import { getHealthColor, drawCrosshair, setupCamera } from "./core/misc";
import { useHealthEffect, handleHealthUpdate, reloadTimed } from "./core/logic";
import { useAudioManager } from "./core/audio";
import useWebSocket from "./core/websocket";

import CameraSelector from "./core/camera_switch_popup";
import CreditsPopup from "./core/sfx_credits";
import { useConsoleLogger } from "./core/console_logger";


import {captureAndSendFrame} from "./core/image";

import './App.css';

// const ASSET_PATH="./project/dist/assets";
// const ASSET_PATH="./assets";
const ASSET_PATH=window.assetpath
// const AUDIO_FILE = "/sounds/hit/hitfast.mp3";
const AUDIO_FILE = "/sounds/reload/reload.mp3";



function App(){
    // Player Stats
    const [k, setK]=useState(0);
    const [d, setD]=useState(0);

    // Player Health
    const [ health, setHealth ] = useState(100);
    const prevHealth = useRef(100);
    const [ healthColor, setHealthColor ] = useState(null);

    // Player Ammo
    const [ ammo, setAmmo ] = useState(33);
    const [ mag_size, setMagSize ] = useState(34);
    const [ inReload, setInReload ] = useState(false);

    // Firing Logic
    const fireRate=80;
    const lastFiringTime = useRef(0);
    const [triggerPulled, setTriggerPulled] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [fireColor, setFireColor] = useState("gray");
    const [zoomedMode, setZoomedMode] = useState(false);
    const [zoomedRef, setZoomedRef] = useState(null);
    const zoomedCanvas = useRef(null);
    const [selectedCamera, setSelectedCamera] = useState(null);
    const cameraIndex = useRef(null);

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
    const [cameras, setCameras] = useState([]);
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log('Cameras:', videoDevices);
        setCameras(videoDevices);
        
        // Automatically select the 3x zoom camera if it's the third rear camera
        if (videoDevices.length >= 3) {
          setSelectedCamera(videoDevices[2].deviceId);
        } else {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error('Error getting cameras:', err);
      }
    };
    // get the cameras to see the options
    useEffect(() => {
        getCameras();
    }, []);
    useEffect(() => {
      if (cameras.length != 0){
        const sel_id=cameras[0].deviceId;
        crosshairRef.current = drawCrosshair(crosshairRef.current);
        setupCamera(videoRef, null);
      }
    }, [cameras]);

    // manage connection with server
    const { isConnected, lastMessage, connect, disconnect, sendMessage } = useWebSocket(window.serverurl);

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
        initSound();
        setLobbyColor('green')
        connect(inputLobbyId);
    }

    useEffect(() => {
        if (isConnected){
            setLobbyColor('green');
        }else{
            setLobbyColor('red');
            setLobbyId(null);
            setLobbyCount(null);
        }
    }, [isConnected]);

    // audio manager
    const { loadSound, playSound, resumeAudioContext } = useAudioManager();
    const initSound = () => {
        // const shoot_path='/sounds/shoot/bhew.mp3';
        // const shoot_path='/sounds/shoot/vts5.mp3';
        // const shoot_path='/sounds/shoot/Thump.mp3';
        // const shoot_path='/sounds/shoot/Thump2.mp3';
        const shoot_path='/sounds/shoot/VTshoot_L.mp3';

        // const shoot_path='/sounds/shoot/Thump_L.mp3';
        // const shoot_path='/sounds/hit/VThit.mp3';
        // const shoot_path='/sounds/kill/VTkill.mp3';




        resumeAudioContext();
        // loadSound('shoot', ASSET_PATH+'/sounds/shoot/acr.mp3');
        loadSound('shoot', ASSET_PATH+shoot_path);
        loadSound('shoot2', ASSET_PATH+shoot_path);
        // loadSound('reload', ASSET_PATH+'/sounds/reload/reload.mp3');
        loadSound('reload', ASSET_PATH+'/sounds/reload/VTreload.mp3');
        // loadSound('reload', ASSET_PATH+'/sounds/kill/VTkill.mp3');
        // loadSound('reload', ASSET_PATH+'/sounds/dead/VTdeath.mp3');

        // loadSound('hit', ASSET_PATH+'/sounds/hit/hitfast.mp3');
        loadSound('hit', ASSET_PATH+'/sounds/hit/VThit.mp3');
        loadSound('kill', ASSET_PATH+'/sounds/kill/VTkill.mp3');
        loadSound('dead', ASSET_PATH+'/sounds/dead/VTdeath.mp3');
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
    const shoot_audio_ref = useRef(false);
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
                      // playSound('shoot');
                      if (shoot_audio_ref.current){
                        playSound('shoot');
                        shoot_audio_ref.current=false;
                      }else{
                        playSound('shoot2');
                        shoot_audio_ref.current=true;
                      }

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



    


    function zoom_img(video, targetCanvas) {
      const zoomFactor = 5.0;
      
      const zoomedWidth = Math.floor(video.videoWidth / zoomFactor);
      const zoomedHeight = Math.floor(video.videoHeight / zoomFactor);
      
      targetCanvas.width = zoomedWidth;
      targetCanvas.height = zoomedHeight;
      const ctx = targetCanvas.getContext('2d');
      
      const sx = Math.floor((video.videoWidth - zoomedWidth) / 2);
      const sy = Math.floor((video.videoHeight - zoomedHeight) / 2);
      
      ctx.drawImage(
        video,
        sx, sy, zoomedWidth, zoomedHeight,
        0, 0, zoomedWidth, zoomedHeight
      );
    }
    // everytime videoRef changes run this function
    useEffect(() => {
      // if ((videoRef.current) && (zoomedMode)){
      let interval = setInterval(() => {
        if (zoomedMode){
          console.log("ZOOMING");
          zoom_img(videoRef.current, zoomedCanvas.current);
        
        }
      }
      , 30);

      return () => {
        clearInterval(interval);
      }
    }, [videoRef]);







    // handle health and surrounding logic
    useHealthEffect(lastMessage, health, setHealth, prevHealth, enemyHealth, setEnemyHealth, prevEnemyHealth, setHealthColor, playSound, setAmmo, mag_size, setLobbyId, setLobbyCount, setK, setD);

    // if reload is triggered handle logic
    function reloadFunction(){
        if ( !inReload && ammo < mag_size){
          playSound('reload');
          reloadTimed(ammo, setAmmo, mag_size, setInReload);
        }
    }

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
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const prevVisibility = useRef(document.visibilityState);
    function handleVisibilityChange() {
      console.log(document.visibilityState)

      // if the state is hiiden navigate to the /re-enter page
      if (document.visibilityState === 'hidden') {
        window.location.href = "/re-enter";
      }



      // console.log(document.visibilityState);
      // if (document.visibilityState === prevVisibility.current) {
      //   return;
      // }

      // if (document.visibilityState !='visible'){
      //   console.log("STOPPING CAMERA");
      //   stopCam();
      // } else if (document.visibilityState === 'visible') {
      //   // getCameras();
      //   console.log('Page visible - refreshing', document.hidden);
      //   setupCamera(videoRef, cameras[0].deviceId);
      // }
    } 
    function stopCam(){
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    }

    function switchCamera(){
      const num_cams=cameras.length;
      stopCam();
      if (cameraIndex.current == null){
        cameraIndex.current=0;
      }else if (cameraIndex.current < num_cams-1){
        cameraIndex.current+=1;
      }else{
        cameraIndex.current=0;
      }
      console.log(cameraIndex.current);
      setupCamera(videoRef, cameras[cameraIndex.current].deviceId);      
    }

    const { logs, clearLogs } = useConsoleLogger();
    const [isVisible, setIsVisible] = useState(false);



    // return the display of the app with all its components
    return(<div className="App" style={{ position: 'relative',left: '5%', justifyContent: 'center' ,width: '90%', height: '440px', backgroundColor: healthColor }}>
        <button 
        style={{
            // position: "absolute",
            // height: "50px",
            position: 'relative',
            padding: 0, margin: 0,
            width: "100%",
            height: "10%",
            fontSize: "20px",
            zIndex: 1,
            top: '5%',
        }}
        onMouseDown={reloadFunction}
        onTouchStart={reloadFunction}
        >
        RELOAD {ammo}/{mag_size}
        </button>
        <div style={{height: 'auto' , position: 'relative', top: '0%', height: '80%', padding: 0, margin: 0}}>

          <div style={{position: 'absolute', padding: "5px", right: '0px', color: 'black'}}>
            <h2>K: {k}, D: {d}</h2>
          </div>
          <video ref={videoRef} autoPlay playsInline 
          style={{ 
            width: "100%",
            width: '100%', 
            height: '100%' , 
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
                zIndex: 1000
            }} 
          />
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
                <h2 style={{ margin: 0, marginBottom: '1rem', zIndex: 1000, color: "black" }}>Connect to Lobby with button below</h2>
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
              }}
              onMouseDown={handlePressStart}
              onTouchStart={handlePressStart}
          >
              FIRE
          </button>
          <p>Health: {health}, Enemy Health: {enemyHealth}<br></br> Hit Latency: {latencyNum}, Lobby {lobbyId}, {lobbyCount}/2 players</p>
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
                Connect to Lobby
            </button>
        </div>
        ) : (
        <button onClick={disconnect}>Disconnect, Lobby: {lobbyId}</button>
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
        <button
            onClick={() => setIsVisible(!isVisible)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
          {isVisible ? 'Hide Console' : 'Show Console'}
        </button>
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