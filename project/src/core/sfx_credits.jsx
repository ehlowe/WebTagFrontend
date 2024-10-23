import React, { useState } from 'react';

const CreditsPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div style={{position: "absolute", bottom: '-200px', left: 0}}>
      <button 
        onClick={() => setIsOpen(true)}
        style={{padding: '0px'}}
      >
        SFX<br></br>Credits
      </button>

      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 2000,
          }}
        >
          <div 
            style={{
              backgroundColor: 'black',
              padding: '20px',
              borderRadius: '8px',
              width: '80%',
              maxWidth: '280px',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '10px',
                border: 'none',
                background: 'none',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
            
            <h2 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>
              Credits
            </h2>
            
            <div style={{ marginBottom: '15px' }}>
              {/* Add your credits text here */}
              <p>
                Death Sound: <a>https://freesound.org/people/Jofae/sounds/368511/</a><br></br>
                Kill Sound: <a>https://freesound.org/people/MadPanCake/sounds/660768/</a><br></br>
                Hit Sound: <a>https://freesound.org/people/User391915396/sounds/570335/</a><br></br>
                Shooting Sound: <a>https://www.youtube.com/watch?v=hcS-DAvsgyk</a><br></br>
                Reload Sound: <a>https://youtu.be/UHi-xECyGTU</a><br></br>
                Some of these are uncopyrighted. Do not use these sounds effects in your own projects without proper attribution or permissions.
              </p>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditsPopup;