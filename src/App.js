import React, {useState, useRef} from 'react';
import './App.css';
import Techno from './techno.mp3';

let canvas;
let canvasCtx;
let initialized = false;

let audioContext;
let buffer;
let analyser;
let bufferLength;

const WIDTH = 900;
const HEIGHT = 240;
const dataArrays = []
const windowSize = 20
let currentDataArrayIndex = 0;
const TOP_THRESHOLD = 0.8

const FFT_SIZE = 4096;

const bufferItemIndexToFrequency = (index) => {
  return index * (22050 / bufferLength)
}

const hzToX = (hz) => {
  return (Math.log2(hz / 22.5) / 11) * WIDTH;
}

const bufferItemIndexToX = (index) => {
  return hzToX(bufferItemIndexToFrequency(index));
}

const initVisualizer = () => {
  audioContext = new AudioContext()
  analyser = audioContext.createAnalyser()
  analyser.fftSize = FFT_SIZE;
  bufferLength = analyser.frequencyBinCount

  // create as much arrays for data as we have window size
  for (var i = 0; i < windowSize; i++) {
    dataArrays.push(new Uint8Array(bufferLength))
  }
}

const initApp = (callback, canvasEl) => {
  canvas = canvasEl;
  canvasCtx = canvas.getContext('2d');
  canvasCtx.imageSmoothingEnabled = false;
  initialized = true;

  initVisualizer()

  window.fetch(Techno)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        callback();
        buffer = audioBuffer;
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
        draw()
      });
}

const draw = () => {
  requestAnimationFrame(draw);

  // we rotate the current data array
  currentDataArrayIndex += 1;
  if (currentDataArrayIndex === windowSize) {
    currentDataArrayIndex = 0;
  }
  const currentDataArray = dataArrays[currentDataArrayIndex]

  analyser.getByteFrequencyData(currentDataArray);


  // clean everything up
  canvasCtx.fillStyle = 'rgb(255, 255, 255)';
  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

  var barHeight;
  let x;
  let y;


  // draw the first shape which represents the peak value:
  canvasCtx.beginPath();
  canvasCtx.moveTo(0, HEIGHT);

  for(var i = 0; i < bufferLength; i++) {
    let max = 0;

    for (var j = 0; j < windowSize; j++) {
      const value =  dataArrays[j][i];
      if (value > max) {
        max = value;
      }
    }

    y = HEIGHT - ((max) / 255 * HEIGHT * TOP_THRESHOLD);
    x = bufferItemIndexToX(i);
    canvasCtx.lineTo(x, y);
  }

  canvasCtx.fillStyle = 'rgb(190,190,190)';
  canvasCtx.lineTo(WIDTH, HEIGHT);
  canvasCtx.closePath();
  canvasCtx.fill();

  // draw second shape which represent average value

  canvasCtx.beginPath();
  canvasCtx.moveTo(0, HEIGHT);

  for(var i = 0; i < bufferLength; i++) {
    let sum = 0;

    for (var j = 0; j < windowSize; j++) {
      sum +=  dataArrays[j][i];
    }

    y = HEIGHT - (sum / windowSize) / 255 * HEIGHT * TOP_THRESHOLD;
    x = bufferItemIndexToX(i);

    canvasCtx.lineTo(x, y);
  }

  canvasCtx.fillStyle = 'rgb(210,210,210)';
  canvasCtx.lineTo(WIDTH, HEIGHT);
  canvasCtx.closePath();
  canvasCtx.fill();
};

//

const play  = (audioBuffer) => {
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(analyser);
  source.connect(audioContext.destination);
  source.start();
}

// SCALE: <Band /> and <Scale />

function Band({position, value}) {
  return (
      <div
        style={{
          position: 'absolute',
          left: `${position}px`,
          fontSize: "10px",
          borderLeft: "1px solid black",
          paddingLeft: "3px"}}
      >
        {value}
      </div>
  )
}

const freqs = [20,50,100,200,500,1000,2000,5000,10000,20000]

function Scale() {
  return (
    <div style={{width: `${WIDTH}px`, height: '10px', position: 'relative'}}>

      {freqs.map((freq) => {
          return <Band key={new String(freq)} position={hzToX(freq)} value={new String(freq).replace(/000$/, 'k')}/>
      })}
    </div>
  )
}

// React init and UI stuff:

function App() {
  const [isLoaded, setLoaded] = useState(false)
  const canvasRef = useRef(null)

  return (
    <div className="App" style={{width: `${WIDTH}px`}}>

      <canvas ref={canvasRef} width={WIDTH*2} height={HEIGHT} />
      <Scale />
      <div>
        {!initialized && <button onClick={() => {initApp(() => setLoaded(true), canvasRef.current)}}>init</button>}
        {initialized && isLoaded && <button onClick={() => {play(buffer)}}>play</button>}

      </div>
    </div>
  );
}

export default App;
