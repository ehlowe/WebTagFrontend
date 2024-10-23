
import { useEffect } from 'react';
import { getHealthColor } from "./misc";


function useHealthEffect(lastMessage, health, setHealth, prevHealth, enemyHealth, setEnemyHealth, prevEnemyHealth, setHealthColor, playSound, setAmmo, mag_size, setLobbyId, setLobbyCount, setK, setD) {
  // if health changes handle logic
  useEffect(() => {
    if (lastMessage == null){
        return;
    }
    let health = lastMessage.health;
    let enemyHealth = lastMessage.enemy_health;
    let lobbyCount = lastMessage.lobby_count;
    let lobbyId = lastMessage.lobby_id;
    if (lobbyCount != null){
      setLobbyCount(lobbyCount);
    }
    if (lobbyId != null){
      setLobbyId(lobbyId);
    }

    if ((health !=null)&&(enemyHealth !=null)){
        setHealth(health);
        setEnemyHealth(enemyHealth);

        setHealthColor(getHealthColor(health, 100));
        // handleHealthUpdate
        const hithealthdata = handleHealthUpdate(health, prevHealth, enemyHealth, prevEnemyHealth);

        // console.log()
        if (hithealthdata.hit){
            console.log("HIT");
            playSound('hit');
        }
        if (hithealthdata.kill==true){
            console.log("KILL");
            setK(prev => prev + 1);
            playSound('kill');
        }
        if (hithealthdata.death){
            playSound('dead');
            setD(prev => prev + 1);
            setAmmo(mag_size);
        }
    }
    prevEnemyHealth.current = enemyHealth;
    prevHealth.current = health;

  }, [lastMessage, prevHealth, prevEnemyHealth]);

}

function handleHealthUpdate(health, prevHealth, enemyHealth, prevEnemyHealth) {

  const data={}
  if (prevEnemyHealth.current > enemyHealth){
    if (enemyHealth <=0 ){
      // death
      data.kill=true;
    }else{
      // hit
      data.hit=true;
    }
  }

  if ((health <= 0) && (prevHealth.current > health)){
    data.death=true;
  }
  // console.log("DATA: ", data);

  return data;
}


function reloadTimed(ammo, setAmmo, mag_size, setInReload){

  if (ammo === mag_size){
    return;
  }
  let reload_time=3.5;
  setAmmo(0);
  setInReload(true);
  const interval = setTimeout(() => {
    setAmmo(mag_size);
    setInReload(false);
  }, reload_time*1000);

  return () => {
    clearTimeout(interval);
    setInReload(false);
  };
}

export { useHealthEffect, handleHealthUpdate, reloadTimed };