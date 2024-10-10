import React, { useState, useEffect, useCallback, useRef} from 'react';


const App = () => {
  const audioContext = useRef(null);
  const audioBuffers = useRef({});

  const loadSound = useCallback(async (name, url) => {
    if (!audioContext.current) {
      console.warn('AudioContext not initialized. Call resumeAudioContext first.');
      return;
    }
  
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.current.decodeAudioData(arrayBuffer);
      audioBuffers.current[name] = audioBuffer;
    } catch (error) {
      console.error('Error loading sound:', error);
    }
  }, []);

  return (
    <div>
      <button onClick={loadSound('kick', 'sounds/kick.wav')}>Load Kick</button>
    </div>
  );
}


export default App;