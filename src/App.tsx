import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Sun, Moon } from 'lucide-react';

const App: React.FC = () => {
  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [round, setRound] = useState<number>(1);
  const [inputTime, setInputTime] = useState<number>(30);
  const [currentLap, setCurrentLap] = useState<number>(1);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const createAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((frequency: number, duration: number) => {
    const audioContext = createAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }, [createAudioContext]);

  const playCountdownBeep = useCallback((secondsLeft: number) => {
    playSound(440 + (5 - secondsLeft) * 50, 0.1); // Increasing pitch for countdown
  }, [playSound]);

  const playFinishSound = useCallback(() => {
    playSound(880, 0.3); // Higher pitch for finish sound
  }, [playSound]);

  useEffect(() => {
    let interval: number | undefined;

    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime - 0.01;
          if (newTime <= 5 && newTime > 0 && Math.floor(newTime) !== Math.floor(prevTime)) {
            playCountdownBeep(Math.floor(newTime));
          }
          if (newTime <= 0) {
            playFinishSound();
            if (currentLap === 2) {
              setRound((prevRound) => prevRound + 1);
              setCurrentLap(1);
              return inputTime - (round - 1);
            } else {
              setCurrentLap(2);
              return inputTime - (round - 1);
            }
          }
          return newTime;
        });
      }, 10);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isRunning, inputTime, round, currentLap, playFinishSound, playCountdownBeep]);

  const handleStart = () => {
    setIsRunning(true);
    if (time === 0) {
      setTime(inputTime);
    }
    // Ensure audio context is resumed on user interaction
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(inputTime);
    setRound(1);
    setCurrentLap(1);
  };

  const formatTime = (timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const hundredths = Math.floor((timeInSeconds % 1) * 100);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${hundredths.toString().padStart(2, '0')}`;
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const quickSelectTimes = [10, 15, 20, 25, 30];

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className={`p-8 rounded-lg shadow-lg w-96 transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-3xl font-bold text-center transition-colors duration-300 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Fitness Linienlauf</h1>
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors duration-300 ${darkMode ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        <div className="mb-4">
          <label htmlFor="inputTime" className={`block text-sm font-medium mb-1 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Streckenzeit (Sekunden):
          </label>
          <input
            type="number"
            id="inputTime"
            value={inputTime}
            onChange={(e) => setInputTime(Number(e.target.value))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors duration-300 ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
            }`}
            min="1"
          />
        </div>
        <div className="mb-4 flex flex-wrap justify-center gap-2">
          {quickSelectTimes.map((t) => (
            <button
              key={t}
              onClick={() => setInputTime(t)}
              className={`px-3 py-1 rounded transition-colors duration-300 ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${inputTime === t ? 'ring-2 ring-blue-500' : ''}`}
            >
              {t}s
            </button>
          ))}
        </div>
        <div className="text-center mb-6">
          <p className={`text-5xl font-bold mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{formatTime(time)}</p>
          <p className={`text-xl transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Runde: {round}</p>
          <p className={`text-lg transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Strecke: {currentLap}/2</p>
        </div>
        <div className="flex justify-center space-x-4">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center transition-colors duration-300"
            >
              <Play size={20} className="mr-2" /> Start
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center transition-colors duration-300"
            >
              <Pause size={20} className="mr-2" /> Stop
            </button>
          )}
          <button
            onClick={handleReset}
            className={`font-bold py-2 px-4 rounded flex items-center transition-colors duration-300 ${
              darkMode
                ? 'bg-gray-600 hover:bg-gray-500 text-white'
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
          >
            <RotateCcw size={20} className="mr-2" /> Neu starten
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;