

// const handleHealthUpdate = (health, enemyHealth) => {
//     setCurrentHealth((currentHealth) => {
//       if (health <= 0 && currentHealth > 0) {
//         playSound('dead');
//         setAmmo(mag_size);
//       }
//       return health;
//     });

//     setEnemyHealth((prevEnemyHealth) => {
//       if (health <= 0) {
//         setHealthColor('purple');
//       } else {
//         setHealthColor(getHealthColor(health, 100));
//       }
//       if (enemyHealth < prevEnemyHealth) {
//         console.log("enemy hit", enemyHealth, prevEnemyHealth);
//         console.log("TIME TO HIT:", Date.now() - lastSentTimeRef.current);
//         setLatencyNum(Date.now() - lastSentTimeRef.current);

//         if (enemyHealth > 0) {
//           playSound('hit');
//         } else if (enemyHealth === 0) {
//           playSound('kill');
//         }
//       }
//       return enemyHealth;
//     });
//   };

function handleHealthUpdate(health, enemyHealth, prevEnemyHealth) {
  if (prevEnemyHealth.current > enemyHealth){
    if (enemyHealth <=0 ){
      // death
      return {death: true};
    }else{
      // hit
      return {hit: true};
    }
  }

  return {};
}


function reloadTimed(ammo, setAmmo, mag_size){

  if (ammo === mag_size){
    return;
  }
  let reload_time=3.0;
  setAmmo(0);
  const interval = setTimeout(() => {
    setAmmo(mag_size);
  }, reload_time*1000);

  return () => {
    clearTimeout(interval);
  };
}

export { handleHealthUpdate, reloadTimed };