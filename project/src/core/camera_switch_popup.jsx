import React, { useState } from 'react';
import { Camera } from 'lucide-react';

const CameraSelector = ({ cameras, onCameraSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 border rounded hover:bg-gray-100"
        style={{
        //   position: 'absolute',
        //   top: '10px',
        //   right: '10px',
          position: 'relative',
          zIndex: 10
        }}
      >
        Change Camera <Camera className="h-4 w-4" />
      </button>

      {isOpen && (
        <div 
          className="bg-black bg-opacity-50 flex items-center justify-center"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(45, 45, 45, 1)',
            bottom: 0,
            zIndex: 2000,
          }}
        >
          <div className="bg-white rounded-lg p-4 w-64 relative mx-2">
            <h2 style={
                {
                    color: 'rgba(255,255,255,1)',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    marginBottom: '1rem',
                }
            }>
                Select Camera
            </h2>
            <p
                style={{
                    color: 'rgba(255,255,255,1)',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    marginBottom: '1rem',
                }}
            >
                If you think more options should be below, refresh the page and try again.
            </p>
            {/* <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button> */}
            
            <div className="space-y-2 mb-4">
              {cameras.map((camera, index) => (
                <button
                  key={camera.deviceId}
                  onClick={() => {
                    onCameraSelect(index);
                    setIsOpen(false);
                  }}
                  className="w-full p-2 text-left hover:bg-gray-100 rounded border border-gray-200"
                >
                  {camera.label || `Camera ${index + 1}`}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CameraSelector;