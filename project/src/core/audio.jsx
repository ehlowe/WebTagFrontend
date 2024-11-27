import React, { useRef, useEffect, useCallback } from 'react';

const audioInstance = new Audio("./assets" + "/sounds/hit/hitfast.mp3");


const useAudioManager = () => {
  const audioContext = useRef(null);
  const audioBuffers = useRef({});
  const audioSources = useRef({});
  const audioRef = useRef(audioInstance);


  const initializeAudioContext = useCallback(() => {
    if (!audioContext.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContext.current = new AudioContext();
    }
  }, []);

  const loadSound = useCallback(
    async (name, url) => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.current.decodeAudioData(arrayBuffer);
        audioBuffers.current[name] = audioBuffer;
      } catch (error) {
        console.error('Error loading sound:', error);
      }
    },
    []
  );
  const loadSoundFS = useCallback(() => {
    audioRef.current.load();
    audioRef.current.play().then(() => {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }).catch(e => {
      console.error('Error loading audio:', e);
    });
  }, []);

  const playSound = useCallback(
    (name) => {
      if (!audioContext.current || !audioBuffers.current[name]) {
        console.warn('AudioContext not initialized or sound not loaded.');
        return;
      }

      const source = audioContext.current.createBufferSource();
      source.buffer = audioBuffers.current[name];
      source.connect(audioContext.current.destination);
      source.start(0);
    },
    []
  );

  const resumeAudioContext = useCallback(() => {
    initializeAudioContext();

    if (audioContext.current.state !== 'running') {
      audioContext.current.resume().then(() => {
        console.log('Audio context resumed');
      }).catch((error) => {
        console.error('Error resuming audio context:', error);
      });
    }
  }, [initializeAudioContext]);

  function initSound(){
    loadSoundFS();
    resumeAudioContext();
    const ASSET_PATH=window.assetpath;
    
    const shoot_path='/sounds/shoot/VTshoot_L.mp3';
    loadSound('shoot', ASSET_PATH+shoot_path);
    loadSound('shoot2', ASSET_PATH+shoot_path);
    loadSound('shoot3', ASSET_PATH+shoot_path);
    loadSound('shoot4', ASSET_PATH+shoot_path);

    loadSound('reload', ASSET_PATH+'/sounds/reload/VTreload.mp3');

    loadSound('hit', ASSET_PATH+'/sounds/hit/VThit.mp3');

    loadSound('kill', ASSET_PATH+'/sounds/kill/VTkill.mp3');

    loadSound('dead', ASSET_PATH+'/sounds/dead/VTdeath.mp3');
  }

  useEffect(() => {
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  return { loadSound, playSound, resumeAudioContext, initSound};
};

export { useAudioManager };
