import React, { useState, useEffect } from 'react';


function GunSelectPopup({selectedGun, setSelectedGun, currentGun, setCurrentGun}){
   const [isOpen, setIsOpen] = useState(false);

  function handleCloseAndSave(selectedGun){
    if (selectedGun!=currentGun){
      console.log("Saving new gun: ", selectedGun);
      setCurrentGun(selectedGun);
    }
    setIsOpen(false);
  }
  
  return (
    <div style={{position: "absolute", top: '5px', left: '-15px', color: 'gray'}}>
      <button 
        onClick={() => setIsOpen(true)}
        style={{padding: '3px', zIndex: 10, position: "relative", color: 'white', backgroundColor: 'gray'}}
      >
        Gun Select
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
            
            <div style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Add your credits text here */}
              <button 
                style={{backgroundColor: selectedGun === 'AR' ? '#3B82F6' : 'white'}}
                onClick={() => setSelectedGun('AR')}
              >
                <b>AR</b>: 25 dmg, 10 rps, 20/mag
              </button>
              <button
                style={{backgroundColor: selectedGun === 'MiniGun' ? '#3B82F6' : 'white'}}
                onClick={() => setSelectedGun('MiniGun')}
              >
                <b>MiniGun</b>: 7 dmg, 27rps, 100/mag
              </button>
              <button
                style={{backgroundColor: selectedGun === 'Sniper' ? '#3B82F6' : 'white'}}
                onClick={() => setSelectedGun('Sniper')}
              >
                <b>Sniper</b>: 100 dmg, 1.3rps, 5/mag
              </button>
              <button
                style={{backgroundColor: selectedGun === 'Shotgun' ? '#3B82F6' : 'white'}}
                onClick={() => setSelectedGun('Shotgun')}
              >
                <b>Shotgun</b>: 8 x8dmg, 30rps, 8/mag
              </button>
            </div>

            <button
              onClick={() => handleCloseAndSave(selectedGun, setSelectedGun, currentGun, setCurrentGun)}
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
              {currentGun!=selectedGun ? "Save" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


function useGunSelectState(setGunDamage, setFireRate, setMagSize, setAmmo, setFiringMode, loadSound){
    const [selectedGun, setSelectedGun] = useState("AR");
    const [currentGun, setCurrentGun] = useState("AR");

    useEffect(() => {
        console.log("Current gun just changed to: ", currentGun);
        setAmmo(-1);
        setGunDamage(Guns[currentGun].dmg);
        setFireRate((1/Guns[currentGun].rps)*1000);
        setMagSize(Guns[currentGun].mag);
        loadNewGunSounds(loadSound, currentGun);
        setFiringMode(Guns[currentGun].firing_mode);
    }, [currentGun]);


    return [selectedGun, setSelectedGun, currentGun, setCurrentGun];
}


function loadNewGunSounds(loadSound,gun){
    const ASSET_PATH=window.assetpath;
    const shoot_path=Guns[gun].shoot_path;
    const reload_path=Guns[gun].reload_path;
    loadSound('shoot', ASSET_PATH+shoot_path);
    loadSound('shoot2', ASSET_PATH+shoot_path);
    loadSound('shoot3', ASSET_PATH+shoot_path);
    loadSound('shoot4', ASSET_PATH+shoot_path);

    loadSound('reload', ASSET_PATH+reload_path);
}


const Guns = {
  AR: {dmg: 12, rps: 12, mag: 20, shoot_path: '/sounds/shoot/VTshoot_L.mp3', reload_path: '/sounds/reload/VTreload.mp3', firing_mode: "auto"},
  MiniGun: {dmg: 5.5, rps: 27, mag: 100, shoot_path: '/sounds/shoot/VTshoot_L.mp3', reload_path: '/sounds/reload/VTreload.mp3', firing_mode: "auto"},
  Sniper: {dmg: 80, rps: 1.3, mag: 5, shoot_path: '/sounds/shoot/ScifiSniper.mp3', reload_path: '/sounds/reload/VTreload.mp3', firing_mode: "single"},
  Shotgun: {dmg: "7x7", rps: 30, mag: 8, shoot_path: '/sounds/shoot/ShotGun.mp3', reload_path: '/sounds/reload/ShotGunReload.mp3', firing_mode: "single"},
}


export default GunSelectPopup;
export {Guns, useGunSelectState};