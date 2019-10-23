import React, {useState, useRef} from 'react';
import './App.css';
import Techno from './techno.mp3';

let audioContext;
let buffer;
let analyser;
let bufferLength;
let canvas;
let canvasCtx;

const WIDTH = 900;
const HEIGHT = 240;

let initialized = false;


let dataArrays = []
let windowSize = 20
let currentDataArray = 0;

let osc30;
let osc100;
let osc500;
let osc1000;
let osc5000;
let osc10000;
let osc20000;
let osc22050;


// all numbers got with fft = 4096 with band number 2048
const calibrationData = [
  {analyserPosition: 0, relativePosition: 0},
  {freq: "30", analyserPosition: 3, relativePosition: 0.16},
  {freq: "100", analyserPosition: 9, relativePosition: 0.31},
  {freq: "500", analyserPosition: 44, relativePosition: 0.52},
  {freq: "1k", analyserPosition: 86, relativePosition: 0.6},
  {freq: "5k", analyserPosition: 427, relativePosition: 0.8},
  {freq: "10k", analyserPosition: 854, relativePosition: 0.89},
  {freq: "20k", analyserPosition: 1707, relativePosition: 0.98},
  {analyserPosition: 2047, relativePosition: 1}
]

let currentCalibrationItem = 0;

const itemPositions = {}

let currentRelativeX = 0;

const totalBands = 2048

for (var position = 0; position < totalBands; position++) {
  const item = calibrationData[currentCalibrationItem]
  const nextItem = calibrationData[currentCalibrationItem+1]

  if (!nextItem) {
    break;
  }

  const distance = nextItem.analyserPosition - item.analyserPosition;

  const relativeDistance = nextItem.relativePosition - item.relativePosition;
  const positionWithinBand = position - item.analyserPosition;

  const movement = relativeDistance / (positionWithinBand + 1)
  currentRelativeX += relativeDistance / distance;

  //console.log(position, positionWithinBand, 'rel x:', currentRelativeX)
  itemPositions[position] = currentRelativeX * WIDTH;

  if (position == nextItem.analyserPosition - 1) {
    currentCalibrationItem += 1;
  }
}


const initOsc = (freq) => {
  const osc = audioContext.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, audioContext.currentTime);
  osc.start();
  osc.connect(analyser)

  return osc;
}

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



const init = (callback, canvasEl) => {
  canvas = canvasEl;
  canvasCtx = canvas.getContext('2d');
  canvasCtx.imageSmoothingEnabled = false;
  initialized = true;
  audioContext = new AudioContext()
  analyser = audioContext.createAnalyser()
  analyser.fftSize =  FFT_SIZE;
  bufferLength = analyser.frequencyBinCount

  osc30 = audioContext.createOscillator()
  osc30.type = 'sine'
  osc30.connect(analyser)


  // initOsc(10000)
  // initOsc(15000)
  // initOsc(20000)

  for (var i = 0; i < windowSize; i++) {
    dataArrays.push(new Uint8Array(bufferLength))
  }

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

  currentDataArray += 1;

  if(currentDataArray === windowSize) {
    currentDataArray = 0;
  }

  const dataArray = dataArrays[currentDataArray]

  analyser.getByteFrequencyData(dataArray);

  canvasCtx.fillStyle = 'rgb(255, 255, 255)';
  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

  var barWidth = 1;
  var barHeight;
  var lineHeight;


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

    lineHeight = (max) / 255 * HEIGHT * 0.8;

    const lineY = HEIGHT-lineHeight;

    const x = bufferItemIndexToX(i);

    canvasCtx.lineTo(x, lineY);
  }
  canvasCtx.fillStyle = 'rgb(190,190,190)';
  canvasCtx.lineTo(WIDTH, HEIGHT);
  canvasCtx.closePath();
  canvasCtx.fill();

  canvasCtx.beginPath();
  canvasCtx.moveTo(0, HEIGHT);

  for(var i = 0; i < bufferLength; i++) {
    let sum = 0;
    let max = 0;

    for (var j = 0; j < windowSize; j++) {
      const value =  dataArrays[j][i];
      sum += value;
      if (value > max) {
        max = value;
      }
    }

    barHeight = (sum/windowSize) / 255 * HEIGHT * 0.8;
    lineHeight = (max) / 255 * HEIGHT * 0.8;

    const y = HEIGHT-barHeight;
    const lineY = HEIGHT-lineHeight;

    const x = bufferItemIndexToX(i);

    canvasCtx.lineTo(x, y);
    //canvasCtx.fillStyle = 'rgb(200,50,50)';
    //canvasCtx.fillRect(x,y,barWidth,barHeight);
  }

  canvasCtx.fillStyle = 'rgb(210,210,210)';
  canvasCtx.lineTo(WIDTH, HEIGHT);
  canvasCtx.closePath();
  canvasCtx.fill();


};

const play  = (audioBuffer) => {
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(analyser);
  source.connect(audioContext.destination);
  source.start();
}


function printPeaks() {
  const array = dataArrays[currentDataArray];

  for (var i = 0; i < array.length; i++) {
    if (array[i] > 0) {
      console.log('i:', i, 'value:', array[i])
    }
  }
}

function Controls() {
  return (
      <>
        <button onClick={() => {play(buffer)}}>play</button>
        <div>
          <button onClick={() => printPeaks()}>print values</button>
        </div>
      </>
  )
}

function Band({position, value}) {
  return (

      <div style={{position: 'absolute', left: `${position}px`, fontSize: "10px", borderLeft: "1px solid black", paddingLeft: "3px"}}>{value}</div>
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

function App() {
  const [isLoaded, setLoaded] = useState(false)
  const canvasRef = useRef(null)

  return (
    <div className="App" style={{width: `${WIDTH}px`}}>

      <canvas ref={canvasRef} width={WIDTH*2} height={HEIGHT} />
      <Scale />
      <div>
        {!initialized && <button onClick={() => {init(() => setLoaded(true), canvasRef.current)}}>init</button>}
        {initialized && isLoaded && <Controls />}

      </div>
    </div>
  );
}

export default App;
