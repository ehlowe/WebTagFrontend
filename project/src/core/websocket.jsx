import { useState, useEffect, useCallback, useRef } from 'react';

class WebSocketManager {
    constructor(url) {
      this.url = url;
      this.ws = null;
    }
  
    connect(onOpen) {
      this.ws = new WebSocket(this.url);
      this.ws.onmessage = this.handleMessage;
    //   this.ws.onopen = () => this.dispatchEvent('wsOpen');
      this.ws.onopen = onOpen;
      this.ws.onclose = () => this.dispatchEvent('wsClose');
      this.ws.onerror = (error) => this.dispatchEvent('wsError', error);
    }
  
    handleMessage = (event) => {
        const jsonString = event.data.replace(/'/g, '"');

        const message = JSON.parse(jsonString);
        this.dispatchEvent('wsMessage', message);
    }
  
    send(message) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        if (message.id=='img'){
            this.ws.send(message.data);
        }else{
            // console.log(message)
            this.ws.send(JSON.stringify(message));
        }
      } else {
        console.error('WebSocket is not connected');
        this.disconnect();
      }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
  
    dispatchEvent(name, data) {
      window.dispatchEvent(new CustomEvent(name, { detail: data }));
    }
  
    // Additional methods for reconnection, etc.
  }
function useWebSocket(serverurl, setLobbyId, setLobbyCount) {
  const [isConnected, setIsConnected] = useState(false);
  const [lobbyColor, setLobbyColor] = useState('red');


  const [lastMessage, setLastMessage] = useState(null);
  const [lastError, setLastError] = useState(null);
  const wss_url = useRef(null);
  const wsManagerRef = useRef(null);

  useEffect(() => {
    // wsManagerRef.current = new WebSocketManager(wss_url);//'https://hippo-funny-formerly.ngrok-free.app/');
    function handleOpen() {
        setIsConnected(true);
        const lobbyId=0;
        const message = lobbyId ? { lobby_id: parseInt(lobbyId) } : {};
        // wsManager.send(message)
    }
    const handleClose = () => setIsConnected(false);
    const handleMessage = (event) => setLastMessage(event.detail);

    window.addEventListener('wsOpen', handleOpen);
    window.addEventListener('wsClose', handleClose);
    window.addEventListener('wsMessage', handleMessage);

    return () => {
      window.removeEventListener('wsOpen', handleOpen);
      window.removeEventListener('wsClose', handleClose);
      window.removeEventListener('wsMessage', handleMessage);
    };
  }, []);

  // handle lobby color
  useEffect(() => {
      if (isConnected){
          setLobbyColor('green');
      }else{
          setLobbyColor('red');
          setLobbyId(null);
          setLobbyCount(null);
      }
  }, [isConnected]);
  
  const connect = useCallback((lobbyId = null) => {
    wsManagerRef.current = new WebSocketManager(wss_url.current);
    console.log("Trying to connect to: ", wss_url.current);
    if (wsManagerRef.current) {
        const handleOpen = () => {
            setIsConnected(true);
            const message = lobbyId ? { lobby_id: parseInt(lobbyId) } : {};
            console.log("OPENING WITH SEND")
            wsManagerRef.current.send(message);
        };
        wsManagerRef.current.connect(handleOpen);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsManagerRef.current) {
        wsManagerRef.current.disconnect();
        setIsConnected(false);
    }
  }, []);

  const sendMessage = useCallback((message) => {
    wsManagerRef.current.send(message);
  }, []);

  return { isConnected, lastMessage, connect, disconnect, sendMessage, wss_url, lobbyColor};
}



function usePeriodicSend(isConnected, sendMessage, gun_damage){
  useEffect(() => {
    const interval = setInterval(() => {
        if (isConnected) {
            sendMessage({ data: "1234567891011121314151617181920", 'gun_damage': gun_damage});
            console.log("Sending message to server: ", { data: "1234567891011121314151617181920", 'gun_damage': gun_damage});
        }
    }, 50);

    return () => {
        clearInterval(interval);
    }
  }, [isConnected, gun_damage]);
}








export default useWebSocket;
export { usePeriodicSend };