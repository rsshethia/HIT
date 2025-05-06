import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// Game elements and styles
const HOSPITAL_BED_HEIGHT = 60;
const HOSPITAL_BED_WIDTH = 100;
const BED_SPACING = 40;
const PATIENT_SIZE = 50;  // Increased patient size for better visibility
const SERVER_SIZE = 80;
const MESSAGE_SIZE = 30;

interface Position {
  x: number;
  y: number;
}

interface Hospital {
  beds: {
    entry: Position;
    bed1: Position;
    bed2: Position;
    exit: Position;
  };
}

interface Servers {
  sender: Position;
  receiver: Position;
  lab: Position; // Laboratory Information System (LIS)
}

interface Message {
  type: 'A01' | 'A02' | 'A03' | 'ORM';
  position: Position;
  visible: boolean;
  active: boolean;
  destination?: 'ehr' | 'lab'; // Message destination for routing
}

enum GameStage {
  INTRO = 'intro',
  PLAYING = 'playing',
  COMPLETE = 'complete'
}

export default function HL7FlowGamePage() {
  const [gameStage, setGameStage] = useState<GameStage>(GameStage.INTRO);
  const [patientPosition, setPatientPosition] = useState<Position | null>(null);
  const [currentBed, setCurrentBed] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const patientRef = useRef<HTMLDivElement>(null);

  // Hospital and server layout configuration
  const hospital: Hospital = {
    beds: {
      entry: { x: 90, y: 80 },
      bed1: { x: 200, y: 150 },
      bed2: { x: 200, y: 260 },
      exit: { x: 90, y: 300 }
    }
  };

  const servers: Servers = {
    sender: { x: 180, y: 80 },  // PAS/EMR sender
    receiver: { x: 180, y: 300 }, // EHR receiver
    lab: { x: 300, y: 180 }  // Lab Information System (LIS)
  };

  // Initialize patient at entry position
  useEffect(() => {
    if (gameStage === GameStage.PLAYING) {
      // Set with a slight offset so it's clearly visible over the entry position
      setPatientPosition({ 
        x: hospital.beds.entry.x + 80, 
        y: hospital.beds.entry.y 
      });
      setCurrentBed('entry');
    }
  }, [gameStage]);

  // Handle bed click - patient will move to the clicked bed
  const handleBedClick = (bedName: string) => {
    if (gameStage !== GameStage.PLAYING) return;
    
    // Don't do anything if clicking the current bed
    if (bedName === currentBed) return;
    
    // Animate the patient moving to the new bed
    setDragActive(true);
    
    // Get destination position
    const destinationPos = hospital.beds[bedName as keyof typeof hospital.beds];
    
    // Move patient to new bed
    setPatientPosition(destinationPos);
    
    // Process the bed change after a short delay to allow animation
    setTimeout(() => {
      setDragActive(false);
      
      // If bed is different from current, trigger the message
      if (bedName !== currentBed) {
        handleBedChange(currentBed, bedName);
        setCurrentBed(bedName);
      }
    }, 300);
  };
  
  // Handle patient movement between beds and generate appropriate HL7 messages
  const handleBedChange = (fromBed: string | null, toBed: string) => {
    let messageType: 'A01' | 'A02' | 'A03';
    
    // Determine message type based on the patient's movement
    if (fromBed === 'entry' && ['bed1', 'bed2'].includes(toBed)) {
      messageType = 'A01'; // Admission
    } else if (['bed1', 'bed2'].includes(fromBed || '') && 
               ['bed1', 'bed2'].includes(toBed)) {
      messageType = 'A02'; // Transfer
    } else if (['bed1', 'bed2'].includes(fromBed || '') && toBed === 'exit') {
      messageType = 'A03'; // Discharge
    } else {
      return; // No message for other movements
    }
    
    // Create and animate the message
    const newMessage: Message = {
      type: messageType,
      position: { ...servers.sender },
      visible: true,
      active: true,
      destination: 'ehr'
    };
    
    setMessage(newMessage);
    
    // Mark step as completed
    const newCompletedSteps = new Set(completedSteps);
    
    if (messageType === 'A01') {
      newCompletedSteps.add('admission');
    } else if (messageType === 'A02') {
      newCompletedSteps.add('transfer');
    } else if (messageType === 'A03') {
      newCompletedSteps.add('discharge');
    }
    
    setCompletedSteps(newCompletedSteps);
    
    // Animate message movement
    animateMessage(newMessage, newCompletedSteps);
  };
  
  // Handle blood test order
  const handleBloodTest = () => {
    if (gameStage !== GameStage.PLAYING || !currentBed || !['bed1', 'bed2'].includes(currentBed)) {
      return; // Can only order tests if patient is in a bed
    }
    
    // Create and animate the ORM message from sender to lab
    const newMessage: Message = {
      type: 'ORM',
      position: { ...servers.sender },
      visible: true,
      active: true,
      destination: 'lab'
    };
    
    setMessage(newMessage);
    
    // Mark step as completed
    const newCompletedSteps = new Set(completedSteps);
    newCompletedSteps.add('lab-order');
    setCompletedSteps(newCompletedSteps);
    
    // Animate message movement
    animateMessage(newMessage, newCompletedSteps);
  };
  
  // Animate a message between systems
  const animateMessage = (messageObj: Message, newCompletedSteps: Set<string>) => {
    let step = 0;
    const totalSteps = 50; // For smooth animation
    
    const moveMessage = () => {
      if (step >= totalSteps) {
        setMessage(prev => prev ? { ...prev, active: false } : null);
        
        // Check if all steps are completed (including new lab order)
        if (newCompletedSteps.size >= 4) {
          setTimeout(() => {
            setGameStage(GameStage.COMPLETE);
          }, 1000);
        }
        
        return;
      }
      
      const progress = step / totalSteps;
      
      // Determine target based on message destination
      const targetSystem = messageObj.destination === 'lab' ? servers.lab : servers.receiver;
      const newX = messageObj.position.x + (targetSystem.x - messageObj.position.x) * progress;
      const newY = messageObj.position.y + (targetSystem.y - messageObj.position.y) * progress;
      
      setMessage(prev => prev ? { 
        ...prev, 
        position: { x: newX, y: newY } 
      } : null);
      
      step++;
      requestAnimationFrame(moveMessage);
    };
    
    requestAnimationFrame(moveMessage);
  };

  // Start the game
  const startGame = () => {
    setGameStage(GameStage.PLAYING);
    setShowInstructions(false);
  };

  // Restart the game
  const restartGame = () => {
    setGameStage(GameStage.PLAYING);
    setPatientPosition({ 
      x: hospital.beds.entry.x + 50, 
      y: hospital.beds.entry.y 
    });
    setCurrentBed('entry');
    setMessage(null);
    setCompletedSteps(new Set());
  };

  // Render intro screen
  const renderIntro = () => (
    <div className="flex flex-col items-center justify-center h-full">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">HL7 Flow Game</CardTitle>
          <CardDescription className="text-lg">
            Learn HL7 ADT messages by moving a patient through a hospital
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
            <h3 className="text-xl font-semibold mb-2">How to Play:</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Click on a hospital bed to move the patient there (Triggers an A01 Admission message)</li>
              <li>Click different beds to move the patient between them (Triggers an A02 Transfer message)</li>
              <li>Finally, click the exit to discharge the patient (Triggers an A03 Discharge message)</li>
            </ol>
            <p className="mt-4 font-medium">Watch the HL7 messages flow between servers as you move the patient!</p>
          </div>
          <div className="flex justify-center">
            <Button size="lg" onClick={startGame}>Start Game</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render game completion screen
  const renderCompletion = () => (
    <div className="flex flex-col items-center justify-center h-full">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            <span className="text-green-600">✓</span> Congratulations!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 bg-green-50 rounded-md border border-green-200">
            <h3 className="text-xl font-semibold mb-4 text-center">You've completed the HL7 Flow simulation!</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">You learned about these HL7 ADT messages:</h4>
                <ul className="mt-2 space-y-2">
                  <li className="flex items-center">
                    <Badge variant="outline" className="mr-2 bg-blue-100">A01</Badge>
                    <span>Admission/Visit Notification - Sent when a patient is admitted to a hospital</span>
                  </li>
                  <li className="flex items-center">
                    <Badge variant="outline" className="mr-2 bg-purple-100">A02</Badge>
                    <span>Transfer a Patient - Sent when a patient is transferred between locations</span>
                  </li>
                  <li className="flex items-center">
                    <Badge variant="outline" className="mr-2 bg-amber-100">A03</Badge>
                    <span>Discharge/End Visit - Sent when a patient is discharged from the hospital</span>
                  </li>
                </ul>
              </div>
              
              <Separator />
              
              <p className="text-gray-700">
                These messages are part of the <strong>HL7 v2.x standard</strong> and are foundational 
                for healthcare integrations, ensuring that patient information flows smoothly between 
                different healthcare systems.
              </p>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={restartGame}>Play Again</Button>
            <Link href="/resources">
              <Button>Back to Resources</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render game play area
  const renderGame = () => (
    <div className="relative mx-auto max-w-4xl h-[500px] shadow-lg border rounded-lg mt-10" ref={gameContainerRef}>
      {/* Progress tracker - centered in the middle */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
        <Card className="w-56 shadow-md">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm text-center">Progress</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  completedSteps.has('admission') ? 'bg-green-500 text-white' : 'bg-gray-200'
                }`}>
                  {completedSteps.has('admission') ? '✓' : '1'}
                </div>
                <span className="ml-2 text-sm">Admission (A01)</span>
              </div>
              
              {/* Vertical connector line */}
              <div className="flex items-center">
                <div className="w-6 flex justify-center">
                  <div className="h-3 w-0.5 bg-gray-300"></div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  completedSteps.has('transfer') ? 'bg-green-500 text-white' : 'bg-gray-200'
                }`}>
                  {completedSteps.has('transfer') ? '✓' : '2'}
                </div>
                <span className="ml-2 text-sm">Transfer (A02)</span>
              </div>
              
              {/* Vertical connector line */}
              <div className="flex items-center">
                <div className="w-6 flex justify-center">
                  <div className="h-3 w-0.5 bg-gray-300"></div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  completedSteps.has('lab-order') ? 'bg-green-500 text-white' : 'bg-gray-200'
                }`}>
                  {completedSteps.has('lab-order') ? '✓' : '3'}
                </div>
                <span className="ml-2 text-sm">Lab Order (ORM)</span>
              </div>
              
              {/* Vertical connector line */}
              <div className="flex items-center">
                <div className="w-6 flex justify-center">
                  <div className="h-3 w-0.5 bg-gray-300"></div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  completedSteps.has('discharge') ? 'bg-green-500 text-white' : 'bg-gray-200'
                }`}>
                  {completedSteps.has('discharge') ? '✓' : '4'}
                </div>
                <span className="ml-2 text-sm">Discharge (A03)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    
      {/* Split screen layout */}
      <div className="absolute left-0 top-0 w-1/2 h-full bg-blue-50 border-r border-gray-300 flex flex-col">
        <div className="p-4 border-b border-gray-300 mt-16">
          <h3 className="text-xl font-bold">Hospital</h3>
        </div>
        
        {/* Render hospital beds */}
        <div className="relative flex-grow">
          {/* Entry */}
          <div 
            className={`absolute border-2 border-gray-400 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 hover:shadow-md transition-all ${currentBed === 'entry' ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
            style={{
              left: hospital.beds.entry.x,
              top: hospital.beds.entry.y,
              width: HOSPITAL_BED_WIDTH,
              height: HOSPITAL_BED_HEIGHT,
              transform: 'translateX(-50%) translateY(-50%)'
            }}
            onClick={() => handleBedClick('entry')}
          >
            <span className="font-bold text-gray-700">ENTRY</span>
          </div>
          
          {/* Bed 1 */}
          <div 
            className={`absolute border-2 border-blue-500 bg-blue-50 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-100 hover:shadow-md transition-all ${currentBed === 'bed1' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
            style={{
              left: hospital.beds.bed1.x,
              top: hospital.beds.bed1.y,
              width: HOSPITAL_BED_WIDTH,
              height: HOSPITAL_BED_HEIGHT,
              transform: 'translateX(-50%) translateY(-50%)'
            }}
            onClick={() => handleBedClick('bed1')}
          >
            <div className="relative w-full h-full">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-bold text-blue-700">BED 1</span>
              </div>
              <div className="absolute -top-6 left-0 right-0 flex justify-center">
                <Badge variant="outline" className="bg-blue-100">Emergency</Badge>
              </div>
            </div>
          </div>
          
          {/* Bed 2 */}
          <div 
            className={`absolute border-2 border-green-500 bg-green-50 rounded-lg flex items-center justify-center cursor-pointer hover:bg-green-100 hover:shadow-md transition-all ${currentBed === 'bed2' ? 'ring-2 ring-offset-2 ring-green-500' : ''}`}
            style={{
              left: hospital.beds.bed2.x,
              top: hospital.beds.bed2.y,
              width: HOSPITAL_BED_WIDTH,
              height: HOSPITAL_BED_HEIGHT,
              transform: 'translateX(-50%) translateY(-50%)'
            }}
            onClick={() => handleBedClick('bed2')}
          >
            <div className="relative w-full h-full">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-bold text-green-700">BED 2</span>
              </div>
              <div className="absolute -top-6 left-0 right-0 flex justify-center">
                <Badge variant="outline" className="bg-green-100">ICU</Badge>
              </div>
            </div>
          </div>
          
          {/* Exit */}
          <div 
            className={`absolute border-2 border-gray-400 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 hover:shadow-md transition-all ${currentBed === 'exit' ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
            style={{
              left: hospital.beds.exit.x,
              top: hospital.beds.exit.y,
              width: HOSPITAL_BED_WIDTH,
              height: HOSPITAL_BED_HEIGHT,
              transform: 'translateX(-50%) translateY(-50%)'
            }}
            onClick={() => handleBedClick('exit')}
          >
            <span className="font-bold text-gray-700">EXIT</span>
          </div>
          
          {/* Patient character (8-bit style) */}
          {patientPosition && (
            <div 
              ref={patientRef}
              className={`absolute flex items-center justify-center ${
                dragActive ? 'z-50' : 'z-50'
              }`}
              style={{
                left: patientPosition.x,
                top: patientPosition.y,
                width: PATIENT_SIZE,
                height: PATIENT_SIZE,
                transform: 'translateX(-50%) translateY(-50%)',
                transition: dragActive ? 'none' : 'all 0.3s ease-out',
                boxShadow: '0 0 10px 3px rgba(0,0,0,0.2)',
                userSelect: 'none',
                touchAction: 'none'
              }}
            >
              <div className="w-full h-full bg-red-500 border-2 border-red-700 rounded-full flex items-center justify-center text-white font-bold pixelated animate-pulse">
                P
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Server side */}
      <div className="absolute right-0 top-0 w-1/2 h-full bg-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-300 mt-16">
          <h3 className="text-xl font-bold">Healthcare Systems</h3>
        </div>
        
        <div className="relative flex-grow">
          {/* Sender server */}
          <div
            className="absolute rounded-lg bg-blue-200 border-2 border-blue-400 flex flex-col items-center justify-center pixelated"
            style={{
              left: servers.sender.x,
              top: servers.sender.y,
              width: SERVER_SIZE,
              height: SERVER_SIZE,
              transform: 'translateX(-50%) translateY(-50%)'
            }}
          >
            <div className="w-4 h-4 bg-green-500 rounded-full mb-1 blink"></div>
            <span className="font-bold text-gray-800 text-sm">PAS</span>
            <span className="text-xs text-gray-600">Sender</span>
          </div>
          
          {/* Receiver server */}
          <div
            className="absolute rounded-lg bg-purple-200 border-2 border-purple-400 flex flex-col items-center justify-center pixelated"
            style={{
              left: servers.receiver.x,
              top: servers.receiver.y,
              width: SERVER_SIZE,
              height: SERVER_SIZE,
              transform: 'translateX(-50%) translateY(-50%)'
            }}
          >
            <div className="w-4 h-4 bg-green-500 rounded-full mb-1 blink"></div>
            <span className="font-bold text-gray-800 text-sm">EHR</span>
            <span className="text-xs text-gray-600">Receiver</span>
          </div>
          
          {/* Lab server */}
          <div
            className="absolute rounded-lg bg-green-200 border-2 border-green-400 flex flex-col items-center justify-center pixelated"
            style={{
              left: servers.lab.x,
              top: servers.lab.y,
              width: SERVER_SIZE,
              height: SERVER_SIZE,
              transform: 'translateX(-50%) translateY(-50%)'
            }}
          >
            <div className="w-4 h-4 bg-green-500 rounded-full mb-1 blink"></div>
            <span className="font-bold text-gray-800 text-sm">LIS</span>
            <span className="text-xs text-gray-600">Lab System</span>
          </div>
          
          {/* Connection line between sender and receiver */}
          <div
            className="absolute bg-gray-300"
            style={{
              left: servers.sender.x,
              top: servers.sender.y,
              width: servers.receiver.x - servers.sender.x,
              height: 4,
              transform: 'translateY(-50%)'
            }}
          ></div>
          
          {/* Connection line between sender and lab */}
          <div
            className="absolute bg-gray-300"
            style={{
              left: servers.sender.x,
              top: servers.sender.y,
              width: Math.abs(servers.lab.x - servers.sender.x),
              height: 4,
              transform: 'rotate(90deg) translateY(-2px) translateX(50px)'
            }}
          ></div>
          
          {/* HL7 Message */}
          {message && message.visible && (
            <div
              className={`absolute rounded-md flex items-center justify-center font-bold text-white pixelated ${
                message.active ? 'z-20' : 'z-10'
              }`}
              style={{
                left: message.position.x,
                top: message.position.y,
                width: MESSAGE_SIZE * 2,
                height: MESSAGE_SIZE,
                transform: 'translateX(-50%) translateY(-50%)',
                transition: message.active ? 'none' : 'all 0.5s ease-out',
                backgroundColor: 
                  message.type === 'A01' ? '#3b82f6' : 
                  message.type === 'A02' ? '#8b5cf6' : 
                  '#f59e0b'
              }}
            >
              {message.type}
            </div>
          )}
        </div>
      </div>
      
      {/* Game instructions overlay */}
      {showInstructions && (
        <div className="absolute right-4 top-20 z-50 w-56">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm">Game Instructions</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="text-xs space-y-2">
                <li className="flex items-start">
                  <Badge variant="outline" className="mr-1 bg-blue-100 text-xs">1</Badge>
                  <span>Click on a hospital bed (A01)</span>
                </li>
                <li className="flex items-start">
                  <Badge variant="outline" className="mr-1 bg-purple-100 text-xs">2</Badge>
                  <span>Click different beds (A02)</span>
                </li>
                <li className="flex items-start">
                  <Badge variant="outline" className="mr-1 bg-amber-100 text-xs">3</Badge>
                  <span>Click exit when done (A03)</span>
                </li>
              </ul>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 w-full text-xs" 
                onClick={() => setShowInstructions(false)}
              >
                Hide
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Back button */}
      <div className="absolute left-4 top-4 z-50">
        <Link href="/resources">
          <Button variant="outline" size="sm">
            <span className="material-icons text-sm mr-1">arrow_back</span>
            Back
          </Button>
        </Link>
      </div>
    </div>
  );

  // Render main game based on the current stage
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      <div className="container mx-auto h-[calc(100vh-4rem)]">
        {gameStage === GameStage.INTRO && renderIntro()}
        {gameStage === GameStage.PLAYING && renderGame()}
        {gameStage === GameStage.COMPLETE && renderCompletion()}
      </div>
      
      {/* CSS for 8-bit pixelated style */}
      <style>
        {`
          .pixelated {
            image-rendering: pixelated;
            font-family: 'Courier New', monospace;
          }
          
          .blink {
            animation: blink 2s infinite;
          }
          
          @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}