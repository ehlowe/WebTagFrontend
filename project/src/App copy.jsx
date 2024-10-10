// const asset_path="project/dist/assets/";
import React, { useState, useRef } from 'react';

const ASSET_PATH="./project/dist/assets";
// const ASSET_PATH="./assets";
const AUDIO_FILE = "/sounds/hit/hitfast.mp3";

const App = () => {
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(new Audio(ASSET_PATH+AUDIO_FILE));

  const loadSound = () => {
    setError(null);
    audioRef.current.load();
    audioRef.current.oncanplaythrough = () => {
      setAudioLoaded(true);
    };
    audioRef.current.onerror = () => {
      setError('Failed to load audio. Please check the file path and format.');
    };
  };

  const playSound = () => {
    if (audioRef.current.paused) {
      audioRef.current.play().catch(e => {
        console.error('Error playing audio:', e);
        setError('Failed to play audio. Please try again.');
      });
    } else {
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Safari iOS Audio App</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button 
          onClick={loadSound} 
          disabled={audioLoaded}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: audioLoaded ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: audioLoaded ? 'default' : 'pointer'
          }}
        >
          {audioLoaded ? 'Audio Loaded' : 'Load Audio'}
        </button>
        <button 
          onClick={playSound} 
          disabled={!audioLoaded}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: audioLoaded ? '#28a745' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: audioLoaded ? 'pointer' : 'default'
          }}
        >
          Play Audio
        </button>
        {error && (
          <div style={{ 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            padding: '0.75rem', 
            borderRadius: '4px', 
            border: '1px solid #f5c6cb' 
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;