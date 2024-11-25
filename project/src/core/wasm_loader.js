import { useEffect, useState } from 'react';


export function useWasmLoader() {
    const [wasmLoaded, setWasmLoaded] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadWasm() {
            try {
                // First check for SIMD and threads support
                const has_simd = await wasmFeatureDetect.simd();
                const has_threads = await wasmFeatureDetect.threads();

                // Determine which module to load
                let nanodet_module_name;
                if (has_simd) {
                    nanodet_module_name = has_threads ? 'nanodet-simd-threads' : 'nanodet-simd';
                } else {
                    nanodet_module_name = has_threads ? 'nanodet-threads' : 'nanodet-basic';
                }

                console.log('loading ' + nanodet_module_name);


                const assets_path='../assets/wasm_stuff/';
                const nanodetwasm = assets_path + nanodet_module_name + '.wasm';
                const nanodetjs = assets_path + nanodet_module_name + '.js';

                // Fetch and load the WASM binary
                const response = await fetch(nanodetwasm);
                const buffer = await response.arrayBuffer();

                // Set up the module
                window.Module = window.Module || {};
                window.Module.wasmBinary = buffer;

                // Create and append the script
                const script = document.createElement('script');
                script.src = nanodetjs;
                
                // Create a promise to wait for script load
                const scriptLoaded = new Promise((resolve, reject) => {
                    script.onload = () => {
                        console.log('Emscripten boilerplate loaded.');
                        resolve();
                    };
                    script.onerror = () => reject(new Error('Failed to load script'));
                });

                document.body.appendChild(script);
                await scriptLoaded;

                setWasmLoaded(true);
            } catch (err) {
                console.error('Error loading WASM:', err);
                setError(err);
            }
        }

        loadWasm();

        // Cleanup function
        return () => {
            // Add any necessary cleanup here
        };
    }, []); // Empty dependency array means this runs once on mount

    return { wasmLoaded, error };
} 


// WASM feature detection utility
const wasmFeatureDetect = {
  bigInt: async () => {
    try {
      const binary = new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 6, 1, 96, 1, 126, 1, 126, 3, 2, 1, 0,
        7, 5, 1, 1, 98, 0, 0, 10, 6, 1, 4, 0, 32, 0, 11,
      ]);
      return (await WebAssembly.instantiate(binary)).instance.exports.b(BigInt(0)) === BigInt(0);
    } catch (e) {
      return false;
    }
  },

  bulkMemory: async () => {
    return WebAssembly.validate(new Uint8Array([
      0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 5, 3, 1,
      0, 1, 10, 14, 1, 12, 0, 65, 0, 65, 0, 65, 0, 252, 10, 0, 0, 11,
    ]));
  },

  simd: async () => {
    return WebAssembly.validate(new Uint8Array([
      0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 10, 9, 1,
      7, 0, 65, 0, 253, 15, 26, 11,
    ]));
  },

  threads: async () => {
    try {
      if (typeof MessageChannel !== 'undefined') {
        new MessageChannel().port1.postMessage(new SharedArrayBuffer(1));
      }
      return WebAssembly.validate(new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 5, 4, 1,
        3, 1, 1, 10, 11, 1, 9, 0, 65, 0, 254, 16, 2, 0, 26, 11,
      ]));
    } catch (e) {
      return false;
    }
  }
};

export { wasmFeatureDetect };