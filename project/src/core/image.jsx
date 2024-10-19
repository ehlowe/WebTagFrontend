
async function captureAndSendFrame(video, sendMessage) {
    const draw_start = Date.now();
    // const video = videoRef.current;
    const zoomFactor=2.0
    // const zoomFactor=1.0
  
    // Calculate dimensions for zoomed area
    const zoomedWidth = Math.floor(video.videoWidth / zoomFactor);
    const zoomedHeight = Math.floor(video.videoHeight / zoomFactor);
  
    // Create a temporary canvas with the zoomed dimensions
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = zoomedWidth;
    tempCanvas.height = zoomedHeight;
    const tempContext = tempCanvas.getContext('2d');
  
    // Calculate starting point to center the zoomed area
    const sx = Math.floor((video.videoWidth - zoomedWidth) / 2);
    const sy = Math.floor((video.videoHeight - zoomedHeight) / 2);
  
    // Draw only the zoomed portion of the video onto the temporary canvas
    tempContext.drawImage(
      video,
      sx, sy, zoomedWidth, zoomedHeight,  // Source rectangle
      0, 0, zoomedWidth, zoomedHeight     // Destination rectangle (same as canvas size)
    );
  
    // Convert the temporary canvas to blob and send via WebSocket
    tempCanvas.toBlob((blob) => {
      sendMessage({data: blob, id: "img"});
      console.log(`Zoomed image sent: ${blob.size} bytes, dimensions: ${zoomedWidth}x${zoomedHeight}`);
    }, 'image/jpeg', 1.0);

    const draw_end = Date.now();
    // console.log(`Draw time: ${draw_end - draw_start} ms`);
}

export { captureAndSendFrame }