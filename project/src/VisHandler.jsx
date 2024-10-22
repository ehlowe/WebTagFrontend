import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const VisibilityHandler = ({ children }) => {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // When page becomes hidden (sleep mode or tab switch)
        console.log('Page hidden - will refresh on return');
      } 
      else if (document.visibilityState === 'visible') {
        console.log('Page visible - refreshing');
      } else {
        // When page becomes visible again
        console.log('Page visible - refreshing');
        window.location.reload();
      }
    };
    console.log('VisibilityHandler mounted');
    console.log(document.visibilityState);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <>
      {document.hidden ? (
        <div className="fixed inset-0 bg-white flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-600" />
            <p className="text-gray-600">Reconnecting camera...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </>
  );
};

export default VisibilityHandler;