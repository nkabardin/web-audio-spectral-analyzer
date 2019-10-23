import React, {useState, useRef} from 'react';
import './App.css';
import Techno from './techno.mp3';

let audioContext;
let buffer;
let analyser;
let bufferLength;
let canvas;
let canvasCtx;

const WIDTH = 1000;
const HEIGHT = 400;

let initialized = false;


let dataArrays = []
let windowSize = 15;
let currentDataArray = 0;

let osc30;
let osc100;
let osc500;
let osc1000;
let osc5000;
let osc10000;
let osc20000;


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



function getBandPosition(band) {

}


// freq: 30 peak: 1-4
// i: 0 value: 188
// i: 1 value: 255
// i: 2 value: 255
// i: 3 value: 255
// i: 4 value: 255
// i: 5 value: 190
// i: 6 value: 97
// i: 7 value: 95
// i: 8 value: 81
// i: 9 value: 66
// i: 10 value: 53
// i: 11 value: 42
// i: 12 value: 31
// i: 13 value: 21
// i: 14 value: 13
// i: 15 value: 4


// freq: 100 peak: 7-10
// i: 0 value: 56
// i: 1 value: 61
// i: 2 value: 71
// i: 3 value: 83
// i: 4 value: 97
// i: 5 value: 103
// i: 6 value: 174
// i: 7 value: 255
// i: 8 value: 255
// i: 9 value: 255
// i: 10 value: 255
// i: 11 value: 185
// i: 12 value: 101
// i: 13 value: 98
// i: 14 value: 84
// i: 15 value: 70
// i: 16 value: 57
// i: 17 value: 46
// i: 18 value: 36
// i: 19 value: 27
// i: 20 value: 18
// i: 21 value: 10
// i: 22 value: 3


// freq: 500 peak: 41-44 || 43
// i: 30 value: 5
// i: 31 value: 12
// i: 32 value: 21
// i: 33 value: 30
// i: 34 value: 40
// i: 35 value: 51
// i: 36 value: 63
// i: 37 value: 77
// i: 38 value: 91
// i: 39 value: 100
// i: 40 value: 148
// i: 41 value: 255
// i: 42 value: 255
// i: 43 value: 255
// i: 44 value: 255
// i: 45 value: 204
// i: 46 value: 92
// i: 47 value: 95
// i: 48 value: 81
// i: 49 value: 67
// i: 50 value: 55
// i: 51 value: 43
// i: 52 value: 33
// i: 53 value: 24
// i: 54 value: 15
// i: 55 value: 7


// freq: 1000 peak: 84-87 || 86
// i: 73 value: 7
// i: 74 value: 15
// i: 75 value: 24
// i: 76 value: 33
// i: 77 value: 43
// i: 78 value: 55
// i: 79 value: 67
// i: 80 value: 81
// i: 81 value: 95
// i: 82 value: 92
// i: 83 value: 204
// i: 84 value: 255
// i: 85 value: 255
// i: 86 value: 255
// i: 87 value: 255
// i: 88 value: 148
// i: 89 value: 100
// i: 90 value: 91
// i: 91 value: 77
// i: 92 value: 63
// i: 93 value: 51
// i: 94 value: 40
// i: 95 value: 30
// i: 96 value: 21
// i: 97 value: 13
// i: 98 value: 5

// freq: 5000 peak: 425-428 || 427
// i: 414 value: 5
// i: 415 value: 13
// i: 416 value: 21
// i: 417 value: 30
// i: 418 value: 40
// i: 419 value: 51
// i: 420 value: 63
// i: 421 value: 77
// i: 422 value: 91
// i: 423 value: 100
// i: 424 value: 148
// i: 425 value: 255
// i: 426 value: 255
// i: 427 value: 255
// i: 428 value: 255
// i: 429 value: 204
// i: 430 value: 92
// i: 431 value: 95
// i: 432 value: 81
// i: 433 value: 67
// i: 434 value: 55
// i: 435 value: 43
// i: 436 value: 33
// i: 437 value: 24
// i: 438 value: 15
// i: 439 value: 7

// freq: 10000 peak: 852-855 || 854
// i: 841 value: 7
// i: 842 value: 15
// i: 843 value: 24
// i: 844 value: 33
// i: 845 value: 43
// i: 846 value: 55
// i: 847 value: 67
// i: 848 value: 81
// i: 849 value: 95
// i: 850 value: 92
// i: 851 value: 204
// i: 852 value: 255
// i: 853 value: 255
// i: 854 value: 255
// i: 855 value: 255
// i: 856 value: 148
// i: 857 value: 100
// i: 858 value: 91
// i: 859 value: 77
// i: 860 value: 63
// i: 861 value: 51
// i: 862 value: 40
// i: 863 value: 30
// i: 864 value: 21
// i: 865 value: 13
// i: 866 value: 5

// freq: 20000 peak: 1705-1708 || 1707
// i: 1695 value: 5
// i: 1696 value: 13
// i: 1697 value: 22
// i: 1698 value: 32
// i: 1699 value: 43
// i: 1700 value: 55
// i: 1701 value: 69
// i: 1702 value: 83
// i: 1703 value: 92
// i: 1704 value: 140
// i: 1705 value: 255
// i: 1706 value: 255
// i: 1707 value: 255
// i: 1708 value: 255
// i: 1709 value: 197
// i: 1710 value: 84
// i: 1711 value: 88
// i: 1712 value: 74
// i: 1713 value: 60
// i: 1714 value: 47
// i: 1715 value: 36
// i: 1716 value: 26
// i: 1717 value: 16
// i: 1718 value: 8



const initOsc = (freq) => {
  const osc = audioContext.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, audioContext.currentTime);
  osc.start();
  osc.connect(analyser)

  return osc;
}

const init = (callback, canvasEl) => {
  canvas = canvasEl;
  canvasCtx = canvas.getContext('2d');
  canvasCtx.imageSmoothingEnabled = false;
  initialized = true;
  audioContext = new AudioContext()
  analyser = audioContext.createAnalyser()
  analyser.fftSize = 4096;
  bufferLength = analyser.frequencyBinCount

  osc30 = audioContext.createOscillator()
  osc30.type = 'sine'
  osc30.connect(analyser)


  //osc30 = initOsc(30)
  //osc100 = initOsc(100)
  //osc500 = initOsc(500)
  //osc1000 = initOsc(1000)
  //osc5000 = initOsc(5000)
  //osc10000 = initOsc(10000)
  // osc20000 = initOsc(20000)

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

  canvasCtx.fillStyle = 'rgb(25, 0, 0)';
  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

  var barWidth = 1;
  var barHeight;
  var lineHeight;

  canvasCtx.beginPath();

  //let coeff = 0.2

  for(var i = 0; i < bufferLength; i++) {
    let sum = 0;
    let max = 0;

    //coeff = coeff + coeff / 800

    for (var j = 0; j < windowSize; j++) {
      const value =  dataArrays[j][i]/3;
      sum += value;
      if (value > max) {
        max = value;
      }
    }

    barHeight = (sum/windowSize) * 8;
    lineHeight = (max) * 8;

    const y = HEIGHT-barHeight/2;
    const lineY = HEIGHT-lineHeight/2;

    const x = itemPositions[i];

    if (i === 0) {
      canvasCtx.moveTo(x, lineY);
    } else {
      canvasCtx.lineTo(x, lineY);
    }

    canvasCtx.fillStyle = 'rgb(200,50,50)';
    canvasCtx.fillRect(x,y,barWidth,barHeight/2);
  }
  canvasCtx.strokeStyle = '#ff0000';
  canvasCtx.stroke();
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

function Scale() {
  return (
    <div style={{width: `${WIDTH}px`, height: '10px', position: 'relative'}}>

      {calibrationData.map((item) => {
        if (item.freq) {
          return <Band key={item.freq} position={item.relativePosition*WIDTH} value={item.freq}/>
        }
      })}
    </div>
  )
}

function App() {
  const [isLoaded, setLoaded] = useState(false)
  const canvasRef = useRef(null)

  return (
    <div className="App" style={{width: `${WIDTH}px`}}>

      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />
      <Scale />
      <div>
        {!initialized && <button onClick={() => {init(() => setLoaded(true), canvasRef.current)}}>init</button>}
        {initialized && isLoaded && <Controls />}

      </div>
    </div>
  );
}

export default App;
