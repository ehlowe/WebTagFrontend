import { useState, useEffect, useRef } from "react";

function useServerRouter(wss_url, connect, inputLobbyId){
    //const routerUrl='https://seal-app-o65d5.ondigitalocean.app/route';
    const routerUrl='https://hippo-funny-formerly.ngrok-free.app';
    //const routerUrl='http://localhost:8000/route';


    // State variables
    const [isPolling, setIsPolling] = useState(false);
    const [serverInfo, setServerInfo] = useState({});
    const pollTimeoutRef = useRef(null);
    const pollIntervalRef = useRef(null);
    

    // fetch to the router on load
    useEffect(() => {
        // fetch to https://24.144.65.101/test and console.log the response
        fetch(routerUrl)
            .then(response => response.json())
            .then(data => {
            console.log("TEST DATA:", data)
            setServerInfo(data);
            })
            .catch(error => {
            console.error('Error fetching data:', error);
            console.log("Setting wss to localhost");
            wss_url.current = "ws://localhost:8765/";
            console.log("WSS SET TO: ", wss_url.current);
            });
    
        // set wss to "wss://"+response.pod_id+"-8765.proxy.runpod.net/
    }, []);
        


    
    useEffect(() => {
        if (isPolling) {
            // Record start time for polling
            const startTime = Date.now();
            const TIMEOUT_DURATION = 40000; // 40 seconds in milliseconds
            const POLL_INTERVAL = 1000; // 1 second in milliseconds

            // Poll every second using time-based check
            pollIntervalRef.current = setInterval(() => {
                const elapsedTime = Date.now() - startTime;
                
                // Check if we've exceeded timeout duration
                if (elapsedTime >= TIMEOUT_DURATION) {
                    setIsPolling(false);
                    clearInterval(pollIntervalRef.current);
                    console.log("Connection polling timed out after 40 seconds");
                    return;
                }

                fetch(routerUrl)
                    .then(response => response.json())
                    .then(data => {
                        console.log("POLL DATA:", data);
                        setServerInfo(data);
                        if (data.status == "RUNNING") {
                            setIsPolling(false);
                            clearInterval(pollIntervalRef.current);
                            console.log("Connection successful:", data);
                            wss_url.current = "wss://"+data.pod_id+"-8765.proxy.runpod.net/";
                            routerConnectToServer(inputLobbyId)
                            console.log("POLLING DONE: ", wss_url.current);
                        }
                    })
                    .catch(error => console.error('Error polling connection:', error));
            }, POLL_INTERVAL);
        }


        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [isPolling, wss_url, serverInfo, inputLobbyId]);

    function routerConnectToServer(){
        connect(inputLobbyId);
    }

    return { isPolling, setIsPolling, serverInfo };
}

export { useServerRouter };