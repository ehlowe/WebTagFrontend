import React, { useState, useEffect, useRef, useCallback, createContext  } from 'react';

import { connectToLobby, disconnect, useConnect} from './core/connection.jsx'

// const WebSocketContext = createContext(null);

function App () {
    const { health, enemyHealth, error } = useConnect(window.serverurl);

    // // const [websocket, setWebsocket] = useState(null);
    // const websocket = useRef(null);
    // const [lobbyId, setLobbyId] = useState(null);
    // const [connectionData, setConnectionData] = useState(null);
    // const [errorLog, setErrorLog] = useState(null);

    // const handleConnect = useCallback(async () => {
    //     await connectToLobby(window.serverurl, websocket, setConnectionData, setLobbyId, setErrorLog);
    //     // toServer(websocket);
    // });

    // const toServerConnection = useCallback(() => {
    //     toServer(websocket);
    // }, [websocket]);


    const handleDisconnect = useCallback(() => {
        disconnect(websocket, setErrorLog, "Disconnected");
    });

    

    return (
        <div>
            <h1>App</h1>
            <button onClick={handleConnect}>Connect to Lobby</button>
            <button onClick={handleDisconnect}>Disconnect</button>
            <p>Lobby ID: {lobbyId}</p>
            {/* Show health if connectionData.health exists otherwise null */}
            <p>Health{connectionData ? connectionData.health : null}</p>

            <p>Error Log: {errorLog}</p>

            {/* show if the wsRef is null */}
            <p>WebSocket: {websocket!=null ? "Connected" : "Not Connected"},</p>
        </div>
    );
}

export default App;