import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, RotateCcw, CheckCircle, XCircle, Trophy, Activity, Heart, Monitor, Share2, Download, Award } from 'lucide-react';

const ClinicalIntegrationPlay = () => {
  const [gameState, setGameState] = useState('waiting');
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedMessages, setSelectedMessages] = useState<any[]>([]);
  const [score, setScore] = useState(0);
  const [currentScenario, setCurrentScenario] = useState(0);
  const [gameStats, setGameStats] = useState({
    totalTime: 0,
    correctSequences: 0,
    totalAttempts: 0,
    averageTime: 0,
    proficiencyLevel: 'Beginner'
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const scenarios = [
    {
      title: "Emergency Department Admission",
      patientJourney: [
        "Patient arrives at ED with chest pain via ambulance",
        "Triaged, registered, and admitted for cardiac monitoring",
        "Lab tests ordered, results received, and patient discharged home"
      ],
      correctSequence: ['ADT^A04', 'ORM^O01', 'ORU^R01', 'ADT^A03'],
      availableMessages: [
        { id: 'ADT^A04', label: 'ADT^A04 - Patient Registration', description: 'Registers new patient in system', icon: '🏥' },
        { id: 'ORM^O01', label: 'ORM^O01 - Order Message', description: 'Places lab/diagnostic orders', icon: '📋' },
        { id: 'ORU^R01', label: 'ORU^R01 - Result Message', description: 'Delivers test results', icon: '🧪' },
        { id: 'ADT^A03', label: 'ADT^A03 - Discharge', description: 'Patient discharge notification', icon: '🚪' },
        { id: 'ADT^A08', label: 'ADT^A08 - Update Info', description: 'Updates patient information', icon: '✏️' },
        { id: 'DFT^P03', label: 'DFT^P03 - Billing', description: 'Financial transaction', icon: '💳' }
      ]
    },
    {
      title: "Surgical Procedure",
      patientJourney: [
        "Patient scheduled for elective surgery arrives for pre-op",
        "Surgery completed successfully with anesthesia monitoring",
        "Post-op recovery completed, patient transferred to ward"
      ],
      correctSequence: ['ADT^A01', 'ORM^O01', 'ADT^A02', 'ADT^A02'],
      availableMessages: [
        { id: 'ADT^A01', label: 'ADT^A01 - Admit Patient', description: 'Admits patient to hospital', icon: '🏥' },
        { id: 'ORM^O01', label: 'ORM^O01 - Surgery Order', description: 'Orders surgical procedure', icon: '🔪' },
        { id: 'ADT^A02', label: 'ADT^A02 - Transfer', description: 'Transfers patient between units', icon: '🛏️' },
        { id: 'ORU^R01', label: 'ORU^R01 - Lab Results', description: 'Laboratory test results', icon: '🧪' },
        { id: 'ADT^A03', label: 'ADT^A03 - Discharge', description: 'Patient discharge', icon: '🚪' },
        { id: 'SIU^S12', label: 'SIU^S12 - Schedule', description: 'Appointment scheduling', icon: '📅' }
      ]
    },
    {
      title: "Outpatient Visit with Referral",
      patientJourney: [
        "Patient arrives for outpatient appointment at primary care",
        "Doctor evaluates patient and orders diagnostic tests",
        "Patient referred to specialist for follow-up care"
      ],
      correctSequence: ['SIU^S12', 'ORM^O01', 'ORU^R01', 'REF^I12'],
      availableMessages: [
        { id: 'SIU^S12', label: 'SIU^S12 - Schedule', description: 'Appointment scheduling', icon: '📅' },
        { id: 'ORM^O01', label: 'ORM^O01 - Order Message', description: 'Places lab/diagnostic orders', icon: '📋' },
        { id: 'ORU^R01', label: 'ORU^R01 - Result Message', description: 'Delivers test results', icon: '🧪' },
        { id: 'REF^I12', label: 'REF^I12 - Referral', description: 'Patient referral to specialist', icon: '👨‍⚕️' },
        { id: 'ADT^A04', label: 'ADT^A04 - Registration', description: 'Registers patient', icon: '🏥' },
        { id: 'MDM^T02', label: 'MDM^T02 - Document', description: 'Clinical document notification', icon: '📄' }
      ]
    }
  ];

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('failed');
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, gameState]);

  const startGame = () => {
    setGameState('playing');
    setTimeLeft(60);
    setSelectedMessages([]);
    setScore(0);
  };

  const resetGame = () => {
    setGameState('waiting');
    setTimeLeft(60);
    setSelectedMessages([]);
    setScore(0);
    setCurrentScenario(0);
  };

  const nextScenario = () => {
    if (currentScenario < scenarios.length - 1) {
      setCurrentScenario(currentScenario + 1);
      setGameState('waiting');
      setTimeLeft(60);
      setSelectedMessages([]);
    } else {
      resetGame();
    }
  };

  const selectMessage = (message: any) => {
    if (gameState !== 'playing' || selectedMessages.length >= scenarios[currentScenario].correctSequence.length) return;
    setSelectedMessages([...selectedMessages, message]);
  };

  const removeMessage = (index: number) => {
    if (gameState !== 'playing') return;
    const newMessages = selectedMessages.filter((_, i) => i !== index);
    setSelectedMessages(newMessages);
  };

  const checkSequence = () => {
    const correct = scenarios[currentScenario].correctSequence;
    const selected = selectedMessages.map(m => m.id);
    
    if (selected.length !== correct.length) return;
    
    const isCorrect = selected.every((msg, index) => msg === correct[index]);
    const timeTaken = 60 - timeLeft;
    
    if (isCorrect) {
      const timeBonus = Math.max(0, timeLeft * 10);
      const newScore = score + 1000 + timeBonus;
      setScore(newScore);
      
      const newStats = {
        ...gameStats,
        totalTime: gameStats.totalTime + timeTaken,
        correctSequences: gameStats.correctSequences + 1,
        totalAttempts: gameStats.totalAttempts + 1
      };
      newStats.averageTime = newStats.totalTime / newStats.totalAttempts;
      newStats.proficiencyLevel = getProficiencyLevel(newStats.correctSequences, newStats.averageTime);
      setGameStats(newStats);
      
      setGameState('completed');
    } else {
      setGameStats({
        ...gameStats,
        totalTime: gameStats.totalTime + timeTaken,
        totalAttempts: gameStats.totalAttempts + 1
      });
      setGameState('failed');
    }
  };

  const getProficiencyLevel = (correct: number, avgTime: number) => {
    const accuracy = gameStats.totalAttempts > 0 ? (correct / gameStats.totalAttempts) * 100 : 0;
    if (accuracy >= 90 && avgTime <= 30) return 'Expert';
    if (accuracy >= 75 && avgTime <= 45) return 'Advanced';
    if (accuracy >= 60 && avgTime <= 50) return 'Intermediate';
    return 'Beginner';
  };

  const showScorecard = () => {
    setGameState('scorecard');
  };

  const shareScorecard = async () => {
    const accuracy = gameStats.totalAttempts > 0 ? Math.round((gameStats.correctSequences / gameStats.totalAttempts) * 100) : 0;
    const text = `I just completed HL7 Message Sequencing training! Score: ${score.toLocaleString()} | Proficiency: ${gameStats.proficiencyLevel} | Accuracy: ${accuracy}%`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HL7 Integration Training Results',
          text: text,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Results copied to clipboard!');
    }
  };

  const downloadScorecard = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = 800;
    canvas.height = 600;
    
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 800, 600);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('HL7 Integration Training', 50, 80);
    
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score.toLocaleString()}`, 50, 150);
    ctx.fillText(`Proficiency: ${gameStats.proficiencyLevel}`, 50, 200);
    const accuracy = gameStats.totalAttempts > 0 ? Math.round((gameStats.correctSequences / gameStats.totalAttempts) * 100) : 0;
    ctx.fillText(`Accuracy: ${accuracy}%`, 50, 250);
    
    const link = document.createElement('a');
    link.download = 'hl7-training-scorecard.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const getMessageColor = (messageId: string, index: number) => {
    if (gameState === 'completed') return 'bg-green-50 border-green-400';
    if (gameState === 'failed') {
      const correctId = scenarios[currentScenario].correctSequence[index];
      return messageId === correctId ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400';
    }
    return 'bg-blue-50 border-blue-300';
  };

  const scenario = scenarios[currentScenario];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-green-50 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Hospital Header */}
        <div className="text-center mb-4 bg-white rounded-lg shadow-lg border border-slate-200 p-3 sm:p-6">
          <div className="w-full h-1 bg-gradient-to-r from-blue-500 via-green-500 to-blue-500 rounded-full mb-3"></div>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-2">
            <div className="bg-blue-600 p-2 rounded-full">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-800">Clinical Integration Training</h1>
            <div className="bg-green-600 p-2 rounded-full">
              <Heart className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-sm text-slate-600">HL7 Message Sequencing Simulation</p>
        </div>

        {/* Status Bar */}
        <div className="bg-slate-900 rounded-lg shadow-xl p-3 mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-white">
            <div className="bg-slate-800 rounded p-2 text-center">
              <Clock className="w-4 h-4 mx-auto mb-1 text-blue-400" />
              <div className={`text-lg font-mono font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-400">Time</div>
            </div>
            
            <div className="bg-slate-800 rounded p-2 text-center">
              <Trophy className="w-4 h-4 mx-auto mb-1 text-yellow-400" />
              <div className="text-lg font-mono font-bold text-yellow-400">{score.toLocaleString()}</div>
              <div className="text-xs text-slate-400">Score</div>
            </div>
            
            <div className="bg-slate-800 rounded p-2 text-center">
              <Activity className="w-4 h-4 mx-auto mb-1 text-purple-400" />
              <div className="text-lg font-mono font-bold text-purple-400">{currentScenario + 1}/{scenarios.length}</div>
              <div className="text-xs text-slate-400">Case</div>
            </div>
            
            <div className="bg-slate-800 rounded p-2">
              {gameState === 'waiting' && (
                <button
                  onClick={startGame}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-2 rounded font-semibold flex items-center justify-center space-x-1 text-sm"
                >
                  <Play className="w-3 h-3" />
                  <span>Start</span>
                </button>
              )}
              
              {(gameState === 'completed' || gameState === 'failed') && (
                <div className="space-y-1">
                  {currentScenario < scenarios.length - 1 ? (
                    <button onClick={nextScenario} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs">
                      Next Case
                    </button>
                  ) : (
                    <button onClick={resetGame} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs">
                      Restart
                    </button>
                  )}
                  <button onClick={resetGame} className="w-full bg-slate-600 hover:bg-slate-700 text-white py-1 px-2 rounded text-xs flex items-center justify-center space-x-1">
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          
          {/* Patient Case */}
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 text-white">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4" />
                  <div>
                    <h2 className="text-base font-bold">{scenario.title}</h2>
                    <p className="text-xs text-blue-100">Clinical Case Study</p>
                  </div>
                </div>
              </div>
              
              <div className="p-3">
                <div className="space-y-2 mb-4">
                  <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Patient Journey</div>
                  {scenario.patientJourney.map((step, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="bg-blue-100 text-blue-700 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-sm text-slate-700">{step}</p>
                    </div>
                  ))}
                </div>
                
                <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Your HL7 Message Sequence</div>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {Array.from({ length: scenario.correctSequence.length }).map((_, index) => {
                    const selectedMessage = selectedMessages[index];
                    return (
                      <div 
                        key={index}
                        className={`border-2 ${selectedMessage ? getMessageColor(selectedMessage.id, index) : 'border-dashed border-slate-300'} 
                          rounded-md p-2 min-h-[80px] flex flex-col justify-between relative transition-all hover:shadow-md
                          ${gameState === 'playing' && selectedMessage ? 'cursor-pointer' : ''}`}
                        onClick={() => selectedMessage && gameState === 'playing' ? removeMessage(index) : null}
                      >
                        {selectedMessage ? (
                          <>
                            <div className="absolute top-1 right-1 bg-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border border-slate-200">
                              {index + 1}
                            </div>
                            <div className="text-2xl mb-1">{selectedMessage.icon}</div>
                            <div>
                              <div className="text-xs font-bold leading-tight">{selectedMessage.id}</div>
                              <div className="text-[10px] text-slate-500 leading-tight">{selectedMessage.description}</div>
                            </div>
                            {(gameState === 'completed' || gameState === 'failed') && (
                              <div className="absolute -top-2 -right-2">
                                {selectedMessage.id === scenario.correctSequence[index] ? 
                                  <CheckCircle className="h-5 w-5 text-green-500" /> : 
                                  <XCircle className="h-5 w-5 text-red-500" />
                                }
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-xs text-slate-400 text-center">
                              <div className="border border-slate-300 rounded-full w-5 h-5 flex items-center justify-center mx-auto mb-1">
                                {index + 1}
                              </div>
                              <span>Empty</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {gameState === 'playing' && selectedMessages.length === scenario.correctSequence.length && (
                  <button
                    onClick={checkSequence}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-bold w-full shadow-lg transition-all"
                  >
                    Check Sequence
                  </button>
                )}
                
                {gameState === 'completed' && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center">
                    <div className="bg-green-100 rounded-full h-10 w-10 flex items-center justify-center mx-auto mb-2">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-green-800 font-bold text-lg mb-1">Correct Sequence!</div>
                    <div className="text-sm text-green-700 mb-2">
                      Great job! You understand the proper HL7 message flow for this clinical scenario.
                    </div>
                    <div className="text-xs text-green-600 font-semibold mb-1">TIME BONUS: +{timeLeft * 10} POINTS</div>
                    {currentScenario < scenarios.length - 1 ? (
                      <button
                        onClick={nextScenario}
                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-bold"
                      >
                        Next Clinical Case
                      </button>
                    ) : (
                      <button
                        onClick={showScorecard}
                        className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded font-bold"
                      >
                        View Final Score
                      </button>
                    )}
                  </div>
                )}
                
                {gameState === 'failed' && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 text-center">
                    <div className="bg-red-100 rounded-full h-10 w-10 flex items-center justify-center mx-auto mb-2">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="text-red-800 font-bold text-lg mb-1">Incorrect Sequence</div>
                    <div className="text-sm text-red-700 mb-2">
                      The message sequence doesn't match the correct clinical workflow for this case.
                    </div>
                    <div className="text-xs bg-white rounded-md p-2 mb-2">
                      <div className="text-slate-700 font-semibold mb-1">Correct HL7 Sequence:</div>
                      <div className="flex flex-wrap justify-center gap-1">
                        {scenario.correctSequence.map((id, index) => (
                          <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {index + 1}. {id}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={resetGame}
                      className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-bold"
                    >
                      Try Again
                    </button>
                  </div>
                )}
                
                {gameState === 'scorecard' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-center">
                    <div className="bg-blue-600 rounded-full h-10 w-10 flex items-center justify-center mx-auto mb-2">
                      <Trophy className="h-6 w-6 text-yellow-300" />
                    </div>
                    <div className="text-blue-800 font-bold text-lg mb-1">HL7 Integration Training Complete!</div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-white rounded-md p-2">
                        <div className="text-xs text-slate-500">FINAL SCORE</div>
                        <div className="text-xl font-bold text-blue-600">{score.toLocaleString()}</div>
                      </div>
                      <div className="bg-white rounded-md p-2">
                        <div className="text-xs text-slate-500">PROFICIENCY</div>
                        <div className="text-xl font-bold text-purple-600">{gameStats.proficiencyLevel}</div>
                      </div>
                    </div>
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={shareScorecard}
                        className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm"
                      >
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                      </button>
                      <button
                        onClick={downloadScorecard}
                        className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={resetGame}
                        className="flex items-center space-x-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-3 rounded text-sm"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Restart</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Message Cabinet */}
          <div className="space-y-3">
            {gameState === 'playing' && (
              <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
                <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-3 text-white">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4" />
                    <div>
                      <h2 className="text-base font-bold">HL7 Message Cabinet</h2>
                      <p className="text-xs text-slate-300">Select messages to place in sequence</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3">
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {scenario.availableMessages.map((message) => {
                      const isAlreadySelected = selectedMessages.some(m => m.id === message.id);
                      return (
                        <div
                          key={message.id}
                          className={`border rounded-md p-2 flex items-center space-x-2 transition-all
                            ${isAlreadySelected ? 'bg-slate-100 opacity-50 cursor-default' : 'bg-white hover:shadow-md cursor-pointer hover:border-blue-300'}`}
                          onClick={() => !isAlreadySelected && selectMessage(message)}
                        >
                          <div className="text-2xl">{message.icon}</div>
                          <div className="flex-1">
                            <div className="text-sm font-bold">{message.label}</div>
                            <div className="text-xs text-slate-500">{message.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {/* Game Status Info */}
            {gameState === 'waiting' && (
              <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 p-3 text-white">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4" />
                    <div>
                      <h2 className="text-base font-bold">Game Instructions</h2>
                      <p className="text-xs text-indigo-200">How to play</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3">
                  <div className="space-y-3">
                    <p className="text-sm text-slate-700">
                      In this game, you'll sequence HL7 messages in the correct order for clinical integrations.
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <div className="bg-blue-100 text-blue-700 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          1
                        </div>
                        <p className="text-sm text-slate-700">
                          You have 60 seconds to arrange the messages in proper sequence
                        </p>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <div className="bg-blue-100 text-blue-700 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          2
                        </div>
                        <p className="text-sm text-slate-700">
                          Select messages from the cabinet to place them in ordered slots
                        </p>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <div className="bg-blue-100 text-blue-700 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          3
                        </div>
                        <p className="text-sm text-slate-700">
                          Click on a placed message to remove it if you need to rearrange
                        </p>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <div className="bg-blue-100 text-blue-700 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          4
                        </div>
                        <p className="text-sm text-slate-700">
                          Click "Check Sequence" when you've filled all slots with your answer
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-sm mt-4 bg-indigo-50 border border-indigo-100 rounded-md p-2 text-indigo-800">
                      Click the <span className="font-bold">Start</span> button in the status bar above to begin!
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {(gameState === 'completed' || gameState === 'failed' || gameState === 'scorecard') && (
              <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
                <div className="bg-gradient-to-r from-purple-700 to-purple-800 p-3 text-white">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4" />
                    <div>
                      <h2 className="text-base font-bold">Performance Stats</h2>
                      <p className="text-xs text-purple-200">Your training progress</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-slate-500">Successful Cases:</div>
                      <div className="text-sm font-bold">{gameStats.correctSequences} / {gameStats.totalAttempts}</div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-slate-500">Accuracy Rate:</div>
                      <div className="text-sm font-bold">
                        {gameStats.totalAttempts > 0 ? 
                          Math.round((gameStats.correctSequences / gameStats.totalAttempts) * 100) : 0}%
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-slate-500">Average Time:</div>
                      <div className="text-sm font-bold">{Math.round(gameStats.averageTime)} seconds</div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-slate-500">Proficiency Level:</div>
                      <div className="text-sm font-bold text-purple-700">{gameStats.proficiencyLevel}</div>
                    </div>
                    
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${gameStats.proficiencyLevel === 'Beginner' ? 25 : 
                                          gameStats.proficiencyLevel === 'Intermediate' ? 50 :
                                          gameStats.proficiencyLevel === 'Advanced' ? 75 : 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalIntegrationPlay;