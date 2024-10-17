import React, { useState, useEffect, useRef, useCallback } from 'react';

import './App.css';

import drawCrosshair from './Misc.jsx';


const mode="p";
let ASSET_PATH="./assets";
if (mode==="p"){
  ASSET_PATH="./project/dist/assets";
}

const constraints = {
  video: {
    facingMode: 'environment',
    height: { min: 960, max: 1500}
  }
};



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

  const loadSound = useCallback(async (name, url) => {
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

  const playSound = useCallback((name) => {
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

  return { loadSound, playSound, resumeAudioContext };
};


function App() {
  const fire_rate = 87;
  const mag_size = 34;
  const [isSending, setIsSending] = useState(false);
  const [log, setLog] = useState([]);
  const [cameraError, setCameraError] = useState(null);
  const [serverUrl, setServerUrl] = useState('');
  const [lobbyId, setLobbyId] = useState(null);
  const [latencyNum, setLatencyNum] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const crosshairRef = useRef(null);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const lastSendTimeRef = useRef(0);
  const lastSentTimeRef = useRef(0);

  const [currentHealth, setCurrentHealth] = useState(100);
  const [healthColor, setHealthColor] = useState('green');
  const [enemyHealthDisplay, setEnemyHealth] = useState(100);

  const reloadIntervalRef = useRef(null);
  const [reloadStartTime, setReloadStartTime] = useState(0);
  const [ammo, setAmmo] = useState(mag_size);
  const varReloadState = useRef(false);

  const { loadSound, playSound, resumeAudioContext } = useAudioManager();

  useEffect(() => {
    setServerUrl(window.serverurl);
  }, []);

  const addLog = (message) => {
    setLog(prevLog => [...prevLog, message]);
  };


  useEffect(() => {
    setupCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);



  



  // Firing Interval
  useEffect(() => {
    let interval;
    if (connected && isButtonPressed) {
      interval = setInterval(() => {
        const now = Date.now();
        if (now - lastSendTimeRef.current >= fire_rate) {
          if ((ammo > 0) && (currentHealth > 0)) {    
            lastSendTimeRef.current = now;       
            sendImage();
          }
        }
      }, 10);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [ammo, connected, cameraError, isButtonPressed]);

  // send a dict to the server every 2s
  useEffect(() => {
    let interval;
    if (connected && isSending) {
      interval = setInterval(() => {
        wsRef.current.send(JSON.stringify({ data: "1234567891011121314151617181920" }));
      }, 50);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }
  , [connected, isSending]);

  useEffect(() => {
    const loopFunction = () => {
      if (!varReloadState.current) {
        setReloadStartTime(Date.now());
        if (ammo <= 0) {
          playSound('reload');
          varReloadState.current = true;
        }
      }
      
      if ((varReloadState.current) && ((Date.now() - reloadStartTime) >= 3000)) {
        setAmmo(mag_size);
        varReloadState.current = false;
      }
    };
    reloadIntervalRef.current = setInterval(loopFunction, 50);

    return () => {
      if (reloadIntervalRef.current) {
        clearInterval(reloadIntervalRef.current);
      }
    };
  }, [ammo, reloadStartTime]);

  const reloadManually = () => {
    if (ammo !== mag_size) {
      setAmmo(0);
    }
  };

  const handleButtonPress = () => {
    setIsButtonPressed(true);
  };

  const handleButtonRelease = () => {
    setIsButtonPressed(false);
  };

  useEffect(() => {
    drawCrosshair(crosshairRef.current);
  }, []);



  const change_camera = () => {
    if (videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    constraints.video.facingMode = constraints.video.facingMode === 'environment' ? 'user' : 'environment';
    setupCamera();
  }

  return (
    <div className="App" style={{ position: 'relative', width: '320px', height: '440px', backgroundColor: healthColor }}>
      <button 
        style={{
          position: "absolute",
          // height: "50px",
          width: "100%",
          height: "10%",
          fontSize: "20px",
          zIndex: 1
        }}
        onMouseDown={reloadManually} 
        onTouchStart={reloadManually}
        disabled={!connected || !!cameraError}
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
      <canvas ref={canvasRef} style={{ display: 'none' }} />
 
      <div>
        <button 
          style={{
            // height: "50px",
            width: "100%",
            height: "20%",
            fontSize: "20px"
          }}
          onMouseDown={handleButtonPress} 
          onMouseUp={handleButtonRelease} 
          onTouchStart={handleButtonPress}
          onTouchEnd={handleButtonRelease}
          onMouseLeave={handleButtonRelease}
          disabled={!connected || !!cameraError}
        >
          FIRE
        </button>
        <p>Health: {currentHealth}, Enemy Health: {enemyHealthDisplay}<br></br> Hit Latency: {latencyNum}</p>
      </div>
      {!connected ? (
        <div>
          <input
            type="number"
            value={lobbyId || ''}
            onChange={(e) => setLobbyId(e.target.value)}
            placeholder="Enter lobby ID (optional)"
            style={{ border: '1px solid #ccc', padding: '0.5rem', marginRight: '0.5rem' }}
          />
          <button onClick={connectToLobby} disabled={!!cameraError}>Connect to Lobby M4</button>
        </div>
      ) : (
        <button onClick={disconnect}>Disconnect, Lobby: {lobbyId}</button>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default App;