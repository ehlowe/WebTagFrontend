import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import useAudioManager from './am';
import PopupExample from './menu.jsx';

const constraints = {
  video: {
    facingMode: 'environment',
    height: { min: 960, max: 2500}
    // width: { min: 1080, ideal: 1080, max: 1080 }, // lock width to 1080px
    // height: { min: 1920, ideal: 1920, max: 1920 } // lock height to 1920px

    // width: { min: 1079, ideal: 1080 , max: 1081},
    // height: { ideal: 1920, min: 1200, max: 2500}
    // width: { ideal: 720 , max: 1200},
    // height: { ideal: 1280 }
    // width: { ideal: 1920 },
    // height: { ideal: 1080 }
    
    // width: { ideal: 1280 },
    // height: { ideal: 720 }
    // width: { ideal: 1920 },
    // height: { ideal: 1080 }
  }
};

function getHealthColor(health, maxHealth) {
  health = Math.max(0, Math.min(health, maxHealth));
  const healthPercentage = (health / maxHealth)**1.5;
  const hue = healthPercentage * 120;
  const saturation = 100 - (healthPercentage * 20);
  const lightness = 40 + (healthPercentage * 20);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function App() {
  const fire_rate = 87;
  const mag_size = 34;
  const [isSending, setIsSending] = useState(false);
  const [log, setLog] = useState([]);
  const [cameraError, setCameraError] = useState(null);
  const [serverUrl, setServerUrl] = useState('');
  const [lobbyId, setLobbyId] = useState(null);
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
  const [latencyNum, setLatencyNum] = useState(0);
  const [ammo, setAmmo] = useState(mag_size);
  const varReloadState = useRef(false);

  const { loadSound, playSound, resumeAudioContext } = useAudioManager();

  useEffect(() => {
    setServerUrl(window.serverurl);
  }, []);

  const addLog = (message) => {
    setLog(prevLog => [...prevLog, message]);
  };

  async function setupCamera() {
    try {
      let stream;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // stream = await navigator.mediaDevices.getUserMedia({ video: {facingMode: 'environment'} });
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
      } else if (navigator.getUserMedia) {
        stream = await new Promise((resolve, reject) => {
          navigator.getUserMedia({ video: {facingMode: 'environment'} }, resolve, reject);
        });
      } else {
        throw new Error('getUserMedia is not supported in this browser');
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera setup error:', err);
      setCameraError(err.message);
      addLog(`Camera error: ${err.message}`);
    }
  }

  useEffect(() => {
    setupCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const connectToLobby = async () => {
    try {
      resumeAudioContext();
      // delay 100ms
      await new Promise(resolve => setTimeout(resolve, 100));
      loadSound('shoot', './assets/sounds/shoot/acr.mp3');
      loadSound('hit', './assets/sounds/hit/hitfast.mp3');
      loadSound('kill', './assets/sounds/kill/kill.mp3');
      loadSound('reload', './assets/sounds/reload/reload.mp3');
      loadSound('dead', './assets/sounds/dead/aDead.mp3');
      await new Promise(resolve => setTimeout(resolve, 100));

      playSound('kill');

      wsRef.current = new WebSocket(serverUrl);

      wsRef.current.onopen = () => {
        const message = lobbyId ? { lobby_id: parseInt(lobbyId) } : {};
        wsRef.current.send(JSON.stringify(message));
      };

      wsRef.current.onmessage = (event) => {
        let jsonString = event.data.replace(/'/g, '"');
        console.log(jsonString);
        let data = null;
        try {
          data = JSON.parse(jsonString);
        } catch (e) {
          jsonString = jsonString.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, function(match, p1) {
            return '"' + p1.replace(/"/g, '\\"') + '"';
          });
          data = JSON.parse(jsonString);
        }

        if (data.lobby_id !== undefined) {
          setLobbyId(data.lobby_id);
          setConnected(true);
          setError(null);
          addLog(`Connected to lobby: ${data.lobby_id}`);
        } else if (data.health !== undefined && data.enemy_health !== undefined) {
          handleHealthUpdate(data.health, data.enemy_health);
        } else if (data.error) {
          setError(data.error);
          addLog(`Error: ${data.error}`);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Failed to connect to the server');
        addLog('WebSocket error occurred');
      };

      wsRef.current.onclose = () => {
        setConnected(false);
        setError('Connection closed');
        addLog('WebSocket connection closed');
      };

      setIsSending(true);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to connect to the server');
      addLog(`Connection error: ${error.message}`);
    }
  };

  const handleHealthUpdate = (health, enemyHealth) => {
    setCurrentHealth((currentHealth) => {
      if (health <= 0 && currentHealth > 0) {
        playSound('dead');
        setAmmo(mag_size);
      }
      return health;
    });

    setEnemyHealth((prevEnemyHealth) => {
      if (health <= 0) {
        setHealthColor('purple');
      } else {
        setHealthColor(getHealthColor(health, 100));
      }
      if (enemyHealth < prevEnemyHealth) {
        console.log("enemy hit", enemyHealth, prevEnemyHealth);
        console.log("TIME TO HIT:", Date.now() - lastSentTimeRef.current);
        setLatencyNum(Date.now() - lastSentTimeRef.current);

        if (enemyHealth > 0) {
          playSound('hit');
        } else if (enemyHealth === 0) {
          playSound('kill');
        }
      }
      return enemyHealth;
    });
  };

  const sendImage = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !cameraError) {
      setAmmo(Math.max(0, ammo - 1));
      


      // let draw_start = Date.now();
      // const context = canvasRef.current.getContext('2d');
      // canvasRef.current.width = videoRef.current.videoWidth;
      // canvasRef.current.height = videoRef.current.videoHeight;
      // context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      // canvasRef.current.toBlob((blob) => {
      //   console.log("Draw time:", Date.now() - draw_start);
      //   setLatencyNum(Date.now() - draw_start);
      //   wsRef.current.send(blob);
      //   addLog(`Image sent: ${blob.size} bytes`);
      //   console.log("Image sent: ", blob.size, "bytes");
      // }, 'image/jpeg', 1.0);
      // lastSentTimeRef.current = Date.now();
      captureAndSendFrame();



      playSound('shoot');
    } else {
      setLatencyNum(67);
      addLog(`WebSocket is not open or camera error. ReadyState: ${wsRef.current?.readyState}`);
    }
  };

  async function captureAndSendFrame() {
    let draw_start = Date.now();
    const video = videoRef.current;
    let zoomFactor=2.0
  
    // Calculate dimensions for zoomed area
    const zoomedWidth = Math.floor(video.videoWidth / zoomFactor);
    const zoomedHeight = Math.floor(video.videoHeight / zoomFactor);
  
    // Create a temporary canvas with the zoomed dimensions
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = zoomedWidth;
    tempCanvas.height = zoomedHeight;
    const tempContext = tempCanvas.getContext('2d');
  
    // Calculate starting point to center the zoomed area
    const sx = Math.floor((video.videoWidth - zoomedWidth) / 2);
    const sy = Math.floor((video.videoHeight - zoomedHeight) / 2);
  
    // Draw only the zoomed portion of the video onto the temporary canvas
    tempContext.drawImage(
      video,
      sx, sy, zoomedWidth, zoomedHeight,  // Source rectangle
      0, 0, zoomedWidth, zoomedHeight     // Destination rectangle (same as canvas size)
    );
  
    // Convert the temporary canvas to blob and send via WebSocket
    tempCanvas.toBlob((blob) => {
      wsRef.current.send(blob);
      console.log(`Zoomed image sent: ${blob.size} bytes, dimensions: ${zoomedWidth}x${zoomedHeight}`);
    }, 'image/jpeg', 1.0);
    // setLatencyNum(Date.now() - draw_start);
    lastSentTimeRef.current = Date.now();
  }

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
    drawCrosshair();
  }, []);

  const drawCrosshair = () => {
    const canvas = crosshairRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      const { width, height } = canvas;

      context.clearRect(0, 0, width, height);
      context.strokeStyle = 'red';
      context.lineWidth = 2;
      const crosshairSize = 20;

      context.beginPath();
      context.moveTo((width/2-crosshairSize), (height / 2));
      context.lineTo((width/2+crosshairSize), height / 2);
      context.stroke();

      context.beginPath();
      context.moveTo(width / 2, (height/2-crosshairSize));
      context.lineTo(width / 2, (height/2+crosshairSize));
      context.stroke();
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setConnected(false);
    setLobbyId(null);
    setCurrentHealth(100);
    setEnemyHealth(100);
    setIsSending(false);
  };

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
          height: "50px",
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
            height: "50px",
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
          <button onClick={connectToLobby} disabled={!!cameraError}>Connect to Lobby</button>
        </div>
      ) : (
        <button onClick={disconnect}>Disconnect, Lobby: {lobbyId}</button>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {/* <div>
        <PopupExample />
      </div> */}
      {/* <button onClick={change_camera}>Change Camera</button> */}
    </div>
  );
}

export default App;