import { useRef, useCallback, useState, useEffect } from 'react';

function useWebSocket(serverUrl) {
  const [connectionData, setConnectionData] = useState(null);
  const [lobbyId, setLobbyId] = useState(null);
  const [errorLog, setErrorLog] = useState(null);
  const wsRef = useRef(null);

  const connectToLobby = useCallback(async () => {
    try {
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
        console.log('WebSocket error:', error);
        disconnect("Failed to connect to the server");
      };

    } catch (error) {
      console.log("ERROR: ", error);
      disconnect("Connection failed");
    }
  }, [serverUrl, lobbyId]);

  const disconnect = useCallback((error) => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setErrorLog(error);
    wsRef.current = null;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({ data: "1234567891011121314151617181920" }));
      }
    }, 50);

    return () => {
      clearInterval(interval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    connectToLobby,
    disconnect,
    connectionData,
    lobbyId,
    errorLog,
  };
}


function useConnect(serverUrl) {
    const [health, setHealth] = useState(null);
    const [enemyHealth, setEnemyHealth] = useState(null);
    const [error, setError] = useState(null);
    const [lobbyId, setLobbyId] = useState(null);
    const wsRef = useRef(null);

    const connectToLobby = useCallback(async (serverUrl) => {
        try {
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
                // setConnected(true);
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
            console.log('WebSocket error:', error);
            disconnect("Failed to connect to the server");
            };
    
        } catch (error) {
            console.log("ERROR: ", error);
            disconnect("Connection failed");
        }
    }, [serverUrl, lobbyId]);


}

export default useWebSocket;
export {useConnect};