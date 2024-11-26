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

import React from "react";
import ReactDOM from "react-dom";
import QRCode from "react-qr-code";



// const ASSET_PATH="./project/dist/assets";
// const ASSET_PATH="./assets";
const ASSET_PATH=window.assetpath
// const AUDIO_FILE = "/sounds/hit/hitfast.mp3";
const AUDIO_FILE = "/sounds/reload/reload.mp3";

// const audioRef = useRef(new Audio("./assets" + "/sounds/hit/hitfast.mp3"));
const audioInstance = new Audio("./assets" + "/sounds/hit/hitfast.mp3");



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
    const fireRate=74;
    //const fireRate=85;

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

    // get query params
    useEffect(() => {
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);

      //get the test param's value
      const queryParamLobbyId = urlParams.get('lobby_id');
      console.log("QUERY LOBBY ID:", queryParamLobbyId);

      if (queryParamLobbyId!=null){
        console.log("NOT NULL PARAM")
        setInputLobbyId(queryParamLobbyId);
        // setInputLobbyId("100");
      } else{
        console.log("NULL PARAM")
      }
      // setInputLobbyId("100");
    }, []);


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
    const { isConnected, lastMessage, connect, disconnect, sendMessage, wss_url } = useWebSocket(window.serverurl);

    const routerUrl='https://seal-app-o65d5.ondigitalocean.app/route';
    //const routerUrl='http://localhost:8000/route';


    // fetch to the router on load
    useEffect(() => {
      // fetch to https://24.144.65.101/test and console.log the response
      fetch(routerUrl)
        .then(response => response.json())
        .then(data => {
          console.log("TEST DATA:", data)
          setServerInfo(data);
        })
        .catch(error => console.error('Error fetching data:', error));

      // set wss to "wss://"+response.pod_id+"-8765.proxy.runpod.net/
    }, []);


    // Handle connection polling
    const [isPolling, setIsPolling] = useState(false);
    const [serverInfo, setServerInfo] = useState({});
    const pollTimeoutRef = useRef(null);
    const pollIntervalRef = useRef(null);

    useEffect(() => {
        if (isPolling) {
            // Record start time for polling
            const startTime = Date.now();
            const TIMEOUT_DURATION = 40000; // 40 seconds in milliseconds
            const POLL_INTERVAL = 1000; // 1 second in milliseconds

            // Poll every second using time-based check
            pollIntervalRef.current = setInterval(() => {
                const elapsedTime = Date.now() - startTime;
                
                // Check if we've exceeded timeout duration
                if (elapsedTime >= TIMEOUT_DURATION) {
                    setIsPolling(false);
                    clearInterval(pollIntervalRef.current);
                    console.log("Connection polling timed out after 40 seconds");
                    return;
                }

                fetch(routerUrl)
                    .then(response => response.json())
                    .then(data => {
                        console.log("POLL DATA:", data);
                        setServerInfo(data);
                        if (data.status == "RUNNING") {
                            setIsPolling(false);
                            clearInterval(pollIntervalRef.current);
                            console.log("Connection successful:", data);
                            wss_url.current = "wss://"+data.pod_id+"-8765.proxy.runpod.net/";
                            joinLobby();
                            console.log("POLLING DONE: ", wss_url.current);
                        }
                    })
                    .catch(error => console.error('Error polling connection:', error));
            }, POLL_INTERVAL);
        }

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [isPolling, wss_url, serverInfo]);
    // Update joinLobby to trigger polling
    function joinLobbyRequest() {
      setIsPolling(true);
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




    // Preload
    const audioRef = useRef(audioInstance);
    const [audioLoaded, setAudioLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const playintervalRef = useRef(null);
  
    // 2. Memoize the playSoundFS function to prevent recreation on rerenders
    const playSoundFS = useCallback(() => {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(e => {
          console.error('Error playing audio:', e);
          setError('Failed to play audio. Please try again.');
        });
      } else {
        audioRef.current.currentTime = 0;
      }
    }, []); // Empty dependency array since it only uses refs
  
    const loadSoundFS = useCallback(() => {
      setError(null);
      audioRef.current.load();
      audioRef.current.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setAudioLoaded(true);
        setIsPlaying(true);
      }).catch(e => {
        console.error('Error loading audio:', e);
        setError('Failed to load audio. Please check the file path and format.');
      });
    }, []);
  
    // // 4. Interval effect with stable dependencies
    // useEffect(() => {
    //   if (isPlaying && audioLoaded) {
    //     playintervalRef.current = setInterval(playSoundFS, 1000);
    //     return () => clearInterval(playintervalRef.current);
    //   }
    // }, [isPlaying, audioLoaded, playSoundFS]);

    // audio manager
    const { loadSound, playSound, resumeAudioContext } = useAudioManager();
    const initSound = () => {
        loadSoundFS();
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
        loadSound('shoot3', ASSET_PATH+shoot_path);
        loadSound('shoot4', ASSET_PATH+shoot_path);
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
    const shoot_audio_ref = useRef(0);
    useEffect(() => {
      let shoot_check_interval = setInterval(() => {
          if (triggerPulled){
              if (Date.now() - lastFiringTime.current >= fireRate){
                  // sendImage();
                  // console.log("TIME: ", Date.now() - lastFiringTime.current);
                  lastFiringTime.current = Date.now();
                  if ((ammo > 0)&&(health>0)){
                      const newammo=ammo-1;
                      setAmmo(newammo);
                      // playSound('shoot');
                      if (shoot_audio_ref.current==0){
                        playSound('shoot');
                        shoot_audio_ref.current=1;
                      }else if (shoot_audio_ref.current==1){
                        playSound('shoot2');
                        shoot_audio_ref.current=2;
                      }
                      else if (shoot_audio_ref.current==2){
                        playSound('shoot3');
                        shoot_audio_ref.current=3;
                      }
                      else if (shoot_audio_ref.current==3){
                        playSound('shoot4');
                        shoot_audio_ref.current=0;
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
    useHealthEffect(lastMessage, health, setHealth, prevHealth, enemyHealth, setEnemyHealth, prevEnemyHealth, setHealthColor, playSound, setAmmo, mag_size, setLobbyId, setLobbyCount, setK, setD, setLatencyNum, lastFiringTime);


    // // monitor the enemyHealth and update latencyNum when the enemyHealth changes
    // useEffect(() => {
    //   if (enemyHealth != prevEnemyHealth.current){
    //     const latency=Date.now()-lastFiringTime.current;
    //     setLatencyNum(latency);
    //   }
    // }, [enemyHealth, lastFiringTime, latencyNum]);

    // if reload is triggered handle logic
    function reloadFunction(){
        if ( !inReload && ammo < mag_size){
          // if (navigator.vibrate) {
          //   navigator.vibrate(2000);
          // }else{
          //   console.log("NO VIBRATE");
          // }
          resumeAudioContext();
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
        onMouseDown={reloadFunction}
        onTouchStart={reloadFunction}
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