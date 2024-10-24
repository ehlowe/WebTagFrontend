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

  useEffect(() => {
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  return { loadSound, playSound, resumeAudioContext };
};

export { useAudioManager };
