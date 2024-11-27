import { useState, useEffect } from "react";

const useGetQueryParams = () => {
    const [inputLobbyId, setInputLobbyId] = useState(null);
    
    useEffect(() => {
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      const queryParamLobbyId = urlParams.get('lobby_id');
      
      if (queryParamLobbyId) {
        setInputLobbyId(queryParamLobbyId);
      }
    }, []);

    return [inputLobbyId, setInputLobbyId];
  };

export { useGetQueryParams };
