import { useEffect, useRef, useContext  } from 'react';

async function connectToLobby(serverUrl, setWebsocket, setConnectionData, setLobbyId, setErrorLog) {

    let websocket = null;
    let lobbyId = null;
    console.log("serverUrl: "+serverUrl);

    try {
        // Open Connection
        websocket = new WebSocket(serverUrl);
        // wsRef.current = websocket;
        setWebsocket(websocket);

        // Send lobby id for connection
        websocket.onopen = () => {
            const message = lobbyId ? { lobby_id: parseInt(lobbyId) } : {};
            console.log("MESSAGE: "+JSON.stringify(message));
            websocket.send(JSON.stringify(message));
        };

        // Wait for response
        websocket.onmessage = (event) => {
            let jsonString = event.data.replace(/'/g, '"');
            console.log(jsonString);
            let data=null;
            try {
                data = JSON.parse(jsonString);
            } catch (e) {
                jsonString = jsonString.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, function(match, p1) {
                    return '"' + p1.replace(/"/g, '\\"') + '"';
                });
                data = JSON.parse(jsonString);
            }

            if (data.health){
                setConnectionData(data);
            }
            if (data.lobby_id !== undefined) {
                setLobbyId(data.lobby_id);
            }   
            if (data.error) {
                disconnect(websocket, setWebsocket, setErrorLog, data.error);
            }
        };   

        useEffect(() => {
            let interval;
            interval = setInterval(() => {
                if (websocket!=null) {
                    websocket.send(JSON.stringify({ data: "1234567891011121314151617181920" }));
                } else {
                    clearInterval(interval);
                }
            }, 50);

            return () => {
                if (interval) {
                    clearInterval(interval);
                }
            }
        }, [websocket]);
    
        websocket.onerror = (error) => {
            console.log('WebSocket error:', error);
            disconnect(websocket, setWebsocket, setErrorLog, "Failed to connect to the server");
        };
        // console.log("SET WSREF: "+wsRef.current);

    } catch (error) {
        console.log("ERROR: "+error);
        disconnect(websocket, setWebsocket, setErrorLog, "test");
    }
};  


function disconnect(websocket, setWebsocket, setErrorLog, error) {
    if (websocket) {
        websocket.close();
    }
    setErrorLog(error);
    setWebsocket(null);
};

export { connectToLobby, disconnect};