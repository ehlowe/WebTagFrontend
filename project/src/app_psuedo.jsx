import { useEffect, useState, useRef, useCallback } from "react";

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















const useAudioManager = () => {
    const audioContext = useRef(null);
    const audioBuffers = useRef({});
    const audioSources = useRef({});
  
    const initializeAudioContext = useCallback(() => {
      if (!audioContext.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext.current = new AudioContext();
      }
    }, []);
  
    const loadSoundM = useCallback(async (name, url) => {
      initializeAudioContext();
  
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.current.decodeAudioData(arrayBuffer);
        audioBuffers.current[name] = audioBuffer;
      } catch (error) {
        console.error('Error loading sound:', error);
      }
    }, [initializeAudioContext]);
  
    const playSoundM = useCallback((name) => {
      if (!audioContext.current || !audioBuffers.current[name]) {
        console.warn('AudioContext not initialized or sound not loaded.');
        return;
      }
  
      // If a source is already playing for this sound, stop it
      if (audioSources.current[name]) {
        audioSources.current[name].stop();
      }
  
      const source = audioContext.current.createBufferSource();
      source.buffer = audioBuffers.current[name];
      source.connect(audioContext.current.destination);
      
      // Store the source so we can stop it later if needed
      audioSources.current[name] = source;
  
      // Use the current time of the AudioContext to schedule sound immediately
      source.start(audioContext.current.currentTime);
    }, []);
  
    const resumeAudioContext = useCallback(() => {
      initializeAudioContext();
  
      if (audioContext.current.state !== 'running') {
        audioContext.current.resume().then(() => {
          console.log('Audio context resumed');
        }).catch((error) => {
          console.error('Error resuming audio context:', error);
        });
      } else {
        console.log('Audio context already running');
      }
    }, [initializeAudioContext]);
  
    useEffect(() => {
      return () => {
        Object.values(audioSources.current).forEach(source => {
          if (source.stop) {
            source.stop();
          }
        });
        if (audioContext.current) {
          audioContext.current.close();
        }
      };
    }, []);
  
    return { loadSoundM, playSoundM, resumeAudioContext };
  };












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
    const [lobbyColor, setLobbyColor] = useState('red');


    const fireRate=80;
    // last firing time
    const lastFiringTime = useRef(0);
    const [triggerPulled, setTriggerPulled] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const handlePressStart = useCallback(() => {
        setIsPressed(true);
        shootPressed(); // Your existing shootPressed function
    }, []);
    
    const handlePressEnd = useCallback(() => {
        setIsPressed(false);
        shootReleased(); // Your existing shootReleased function
    }, []);

    const [fireColor, setFireColor] = useState("gray");
    const audioRef = useRef(null);
    const shootSoundRef = useRef(null);
    const shootSoundRef2 = useRef(null);
    const soundSelect=useRef(0);

    useEffect(() => {
        audioRef.current = new Audio(ASSET_PATH + AUDIO_FILE);
        shootSoundRef.current = new Audio(ASSET_PATH + "/sounds/shoot/acr.mp3");
        shootSoundRef2.current = new Audio(ASSET_PATH + "/sounds/shoot/acr.mp3");
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

    const loadShootSound2 = () => {
        console.log("LOADING SHOOT SOUND 2")
        shootSoundRef2.current.load();
        shootSoundRef2.current.play().then(() => {
            shootSoundRef2.current.pause();
            shootSoundRef2.current.currentTime = 0;
        }).catch(e => {
            console.error('Error loading audio:', e);
        });
    };

    const playShootSound2 = () => {
        if (shootSoundRef2.current.paused) {
            shootSoundRef2.current.play().catch(e => {
                console.error('Error playing audio:', e);
            });
        } else {
            shootSoundRef2.current.currentTime = 0;
        }
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
        loadShootSound2();
        resumeAudioContext();
        loadSoundM('shoot', ASSET_PATH+'/sounds/shoot/acr.mp3');
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


    const { loadSoundM, playSoundM, resumeAudioContext } = useAudioManager();

















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
        setLobbyColor('green')
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
                        playSoundM('shoot');
                        // if (soundSelect.current==0){
                        //     playShootSound2();
                        //     soundSelect.current=1;
                        // }
                        // else {
                        //     playShootSound();
                        //     soundSelect.current=0;
                        // }
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


    // if reload is triggered handle logic
    function reloadFunction(){
        playSound();
        reloadTimed(ammo, setAmmo, mag_size);
    }


    // return the display of the app with all its components
    return(<div className="App" style={{ position: 'relative', width: '320px', height: '440px', backgroundColor: healthColor }}>
        {/* <p>LM: {String(lastMessage)}</p> */}
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

            // onMouseDown={shootPressed} 
            // onMouseUp={shootReleased} 
            // onTouchStart={shootPressed}
            // onTouchCancel ={shootReleased}
            // onTouchMove={(e) => {
            //     if (e.touches.length === 0) {
            //       shootReleased();
            //     }
            //   }}
            // onMouseLeave={shootReleased}

            // onMouseDown={(e) => {
            //     e.preventDefault();
            //     shootPressed();
            // }}
            // onMouseUp={(e) => {
            //     e.preventDefault();
            //     shootReleased();
            // }}
            // onTouchStart={(e) => {
            //     e.preventDefault();
            //     shootPressed();
            // }}
            // onTouchEnd={(e) => {
            //     e.preventDefault();
            //     shootReleased();
            // }}
            // onTouchCancel={(e) => {
            //     e.preventDefault();
            //     shootReleased();
            // }}
            // onContextMenu={
            //     (e) => e.preventDefault()
            // }
            
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
        <button onClick={loadSound}>Load Sound</button>
    </div>);
}

export default App;