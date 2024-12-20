




import { useState, useEffect, useRef } from "react";






function useImgZoomer(videoRef, zoomedMode){
  const zoomedCanvas = useRef(null);

  // everytime videoRef changes run this function
  useEffect(() => {
    // if ((videoRef.current) && (zoomedMode)){
    let interval = setInterval(() => {
      if (zoomedMode){
        zoom_img(videoRef.current, zoomedCanvas.current);
      }
    }
    , 30);

    return () => {
      clearInterval(interval);
    }
  }, [videoRef]);

  return zoomedCanvas;
}





async function captureAndSendFrame(video, sendMessage) {
    const draw_start = Date.now();
    // const video = videoRef.current;
    const zoomFactor=2.5
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
    }, 'image/jpeg', 0.7);

    const draw_end = Date.now();
    // console.log(`Draw time: ${draw_end - draw_start} ms`);
}


function zoom_img(video, targetCanvas) {
  const zoomFactor = 5.0;
  
  const zoomedWidth = Math.floor(video.videoWidth / zoomFactor);
  const zoomedHeight = Math.floor(video.videoHeight / zoomFactor);
  
  targetCanvas.width = zoomedWidth;
  targetCanvas.height = zoomedHeight;
  const ctx = targetCanvas.getContext('2d');
  
  const sx = Math.floor((video.videoWidth - zoomedWidth) / 2);
  const sy = Math.floor((video.videoHeight - zoomedHeight) / 2);
  
  ctx.drawImage(
    video,
    sx, sy, zoomedWidth, zoomedHeight,
    0, 0, zoomedWidth, zoomedHeight
  );
}




function drawCrosshair(canvas) {
  // const canvas = crosshairRef.current;
  if (canvas) {
      const context = canvas.getContext('2d');
      const { width, height } = canvas;
      console.log("WIDTH HEIGHT: ", width, height);

      context.clearRect(0, 0, width, height);
      context.strokeStyle = 'red';
      context.lineWidth = 1;
      const crosshairSizeW = 20;
      const crosshairSizeH = crosshairSizeW*height/width

      context.beginPath();
      context.moveTo((width/2-crosshairSizeW), (height / 2));
      context.lineTo((width/2+crosshairSizeW), height / 2);
      context.stroke();

      // context.lineWidth = context.lineWidth*width/height
      context.beginPath();
      context.moveTo(width / 2, (height/2-crosshairSizeH));
      context.lineTo(width / 2, (height/2+crosshairSizeH));
      context.stroke();
  }
};




































function useCamera(videoRef, crosshairRef) {
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);

  // Get available cameras
  useEffect(() => {
      const getCameras = async () => {
          try {
              const devices = await navigator.mediaDevices.enumerateDevices();
              const videoDevices = devices.filter(device => device.kind === 'videoinput');
              console.log('Cameras:', videoDevices);
              setCameras(videoDevices);
              
              // Automatically select the 3x zoom camera if it's the third rear camera
              if (videoDevices.length >= 3) {
                  setSelectedCamera(videoDevices[2].deviceId);
              } else {
                  setSelectedCamera(videoDevices[0].deviceId);
              }
          } catch (err) {
              console.error('Error getting cameras:', err);
          }
      };

      getCameras();
  }, []);

  // Setup camera and crosshair when cameras are available
  useEffect(() => {
      if (cameras.length !== 0) {
          crosshairRef.current = drawCrosshair(crosshairRef.current);
          setupCamera(videoRef, null);
      }
  }, [cameras, videoRef, crosshairRef]);

  return { cameras, selectedCamera, setSelectedCamera };
}


async function setupCamera(videoRef, sel_id) {
  // const constraints = {
  //     video: {
  //       facingMode: 'environment',
  //       deviceId: sel_id,
  //       // height: { min: 960, max: 1500}
  //     }
  //   };
  let constraints;
  if (sel_id==null) {
    constraints = {
      video: {
        facingMode: 'environment',
        // deviceId: sel_id,
        // height: { min: 1000, max: 2500, ideal: 2000 },
        // height: { min: 900, max: 1600, ideal: 1000 },
        height: { min: 800, max: 2200, ideal: 1000 },



        // set ideal aspect ratio to 1:1, but allow for some variation
        aspectRatio: { ideal: 1 , min: 0.5, max: 2}
      }
    };
  } else {
    console.log("SELECTING: ", sel_id);
    constraints = {
      video: {
        // facingMode: 'environment',
        deviceId: sel_id,
        height: { min: 900, max: 1600, ideal: 1000 },
        aspectRatio: { ideal: 1 }
        // height: { min: 1000, max: 2500, ideal: 2000 },
        // height: { min: 900, max: 2000, ideal: 1000 },
      }
    };
  }

  // if (videoRef.current.srcObject) {
  //   videoRef.current.srcObject.getTracks().forEach(track => track.stop());
  // }
  // constraints.video.facingMode = constraints.video.facingMode === 'environment' ? 'user' : 'environment';

  try {
    let stream;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // stream = await navigator.mediaDevices.getUserMedia({ video: {facingMode: 'environment'} });
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      
    } else if (navigator.getUserMedia) {
      stream = await new Promise((resolve, reject) => {
        navigator.getUserMedia({ video: {facingMode: 'environment'} }, resolve, reject);
      });
    } else {
      throw new Error('getUserMedia is not supported in this browser');
    }

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  } catch (err) {
    console.error('Camera setup error:', err);
  }
}
function stopCam(videoRef){
  if (videoRef.current.srcObject) {
    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
  }
}

function switchCamera(videoRef, cameras, cameraIndex){
  const num_cams=cameras.length;
  stopCam(videoRef);
  if (cameraIndex.current == null){
    cameraIndex.current=0;
  }else if (cameraIndex.current < num_cams-1){
    cameraIndex.current+=1;
  }else{
    cameraIndex.current=0;
  }
  console.log(cameraIndex.current);
  setupCamera(videoRef, cameras[cameraIndex.current].deviceId);      
}



export { captureAndSendFrame, useImgZoomer,zoom_img, drawCrosshair, setupCamera, stopCam, switchCamera, useCamera };