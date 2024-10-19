

import React, { useRef, useEffect, useCallback } from 'react';


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


export { useAudioManager };