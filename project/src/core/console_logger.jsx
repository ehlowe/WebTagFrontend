// useConsoleLogger.js
import { useState, useEffect } from 'react';

export const useConsoleLogger = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Store original console methods
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    };

    // Function to add new log to state
    const addLog = (type, args) => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prevLogs => [...prevLogs, {
        type,
        content: Array.from(args).map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '),
        timestamp,
        id: Date.now()
      }]);
    };

    // Override console methods
    console.log = (...args) => {
      addLog('log', args);
      originalConsole.log.apply(console, args);
    };

    console.error = (...args) => {
      addLog('error', args);
      originalConsole.error.apply(console, args);
    };

    console.warn = (...args) => {
      addLog('warn', args);
      originalConsole.warn.apply(console, args);
    };

    console.info = (...args) => {
      addLog('info', args);
      originalConsole.info.apply(console, args);
    };

    console.debug = (...args) => {
      addLog('debug', args);
      originalConsole.debug.apply(console, args);
    };

    // Capture uncaught errors
    const errorHandler = (event) => {
      addLog('error', [event.error?.message || event.message || 'Unknown error']);
    };
    window.addEventListener('error', errorHandler);

    // Cleanup function to restore original console
    return () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
      window.removeEventListener('error', errorHandler);
    };
  }, []);

  const clearLogs = () => setLogs([]);

  return { logs, clearLogs };
};