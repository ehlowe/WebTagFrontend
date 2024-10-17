// send a dict to the server every 2s
useEffect(() => {
    let interval;
    if (connected && isSending) {
      interval = setInterval(() => {
        wsRef.current.send(JSON.stringify({ data: "1234567891011121314151617181920" }));
      }, 50);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }
  , [connected, isSending]);