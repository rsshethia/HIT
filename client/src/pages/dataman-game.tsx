import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Trophy, Shield, Database, AlertTriangle, Info } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface DataPoint {
  id: string;
  type: string;
  position: Position;
  collected: boolean;
  department: string;
  label: string;
  color: string;
}

interface SecurityThreat {
  id: string;
  type: string;
  position: Position;
  direction: Position;
  active: boolean;
  color: string;
}

interface Department {
  id: string;
  name: string;
  description: string;
  dataTypes: Array<{
    type: string;
    label: string;
    color: string;
    description: string;
  }>;
  integrationChallenges: string[];
  standards: string[];
}

const DEPARTMENTS: Department[] = [
  {
    id: 'emergency',
    name: 'Emergency Department',
    description: 'Real-time critical data integration for life-saving decisions',
    dataTypes: [
      { type: 'triage', label: 'TR', color: '#ef4444', description: 'Triage assessments and priority scoring' },
      { type: 'vitals', label: 'VT', color: '#f97316', description: 'Real-time vital signs monitoring' },
      { type: 'alerts', label: 'AL', color: '#eab308', description: 'Critical care alerts and notifications' },
      { type: 'orders', label: 'OR', color: '#22c55e', description: 'Emergency treatment orders' }
    ],
    integrationChallenges: [
      'Real-time data synchronization across multiple systems',
      'Critical alert management and escalation protocols',
      'Mobile device integration for bedside care'
    ],
    standards: ['HL7 ADT^A01', 'HL7 ORM^O01', 'FHIR Emergency Module']
  },
  {
    id: 'icu',
    name: 'Intensive Care Unit',
    description: 'Continuous monitoring integration for critical patients',
    dataTypes: [
      { type: 'monitoring', label: 'MN', color: '#3b82f6', description: 'Continuous patient monitoring data' },
      { type: 'ventilator', label: 'VE', color: '#6366f1', description: 'Ventilator settings and readings' },
      { type: 'infusion', label: 'IV', color: '#8b5cf6', description: 'IV pump and infusion data' },
      { type: 'alarms', label: 'AM', color: '#ec4899', description: 'Critical care alarms and responses' }
    ],
    integrationChallenges: [
      'Device interoperability with monitoring equipment',
      'High-frequency data streaming and storage',
      'Alarm fatigue management and intelligent filtering'
    ],
    standards: ['IEEE 11073', 'HL7 ORU^R01', 'IHE PCD-01']
  },
  {
    id: 'laboratory',
    name: 'Laboratory',
    description: 'Test ordering and results integration workflow',
    dataTypes: [
      { type: 'orders', label: 'LO', color: '#059669', description: 'Laboratory test orders and requisitions' },
      { type: 'results', label: 'LR', color: '#0891b2', description: 'Lab results and critical values' },
      { type: 'micro', label: 'MC', color: '#0284c7', description: 'Microbiology cultures and sensitivities' },
      { type: 'path', label: 'PT', color: '#7c3aed', description: 'Pathology reports and diagnoses' }
    ],
    integrationChallenges: [
      'Laboratory Information System (LIS) integration',
      'Critical value alerting and communication',
      'Quality control and result validation workflows'
    ],
    standards: ['HL7 ORM^O01', 'HL7 ORU^R01', 'LOINC Codes']
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy',
    description: 'E-prescribing and medication management integration',
    dataTypes: [
      { type: 'prescriptions', label: 'RX', color: '#dc2626', description: 'Electronic prescriptions and orders' },
      { type: 'dispensing', label: 'DS', color: '#ea580c', description: 'Medication dispensing records' },
      { type: 'interactions', label: 'DI', color: '#d97706', description: 'Drug interaction alerts and checks' },
      { type: 'inventory', label: 'IN', color: '#ca8a04', description: 'Pharmacy inventory management' }
    ],
    integrationChallenges: [
      'NCPDP SCRIPT integration for e-prescribing',
      'Drug interaction database integration',
      'Automated dispensing cabinet connectivity'
    ],
    standards: ['NCPDP SCRIPT', 'HL7 RDE^O11', 'FHIR Medication Module']
  },
  {
    id: 'radiology',
    name: 'Radiology',
    description: 'DICOM and imaging workflow integration',
    dataTypes: [
      { type: 'orders', label: 'RO', color: '#7c2d12', description: 'Radiology orders and scheduling' },
      { type: 'images', label: 'DI', color: '#92400e', description: 'DICOM images and studies' },
      { type: 'reports', label: 'RR', color: '#b45309', description: 'Radiology reports and interpretations' },
      { type: 'pacs', label: 'PC', color: '#d97706', description: 'PACS integration and workflow' }
    ],
    integrationChallenges: [
      'DICOM image transfer and storage protocols',
      'RIS-PACS integration workflows',
      'Large file handling and network optimization'
    ],
    standards: ['DICOM', 'HL7 ORM^O01', 'IHE RAD Profiles']
  },
  {
    id: 'surgery',
    name: 'Surgery',
    description: 'OR scheduling and surgical device integration',
    dataTypes: [
      { type: 'scheduling', label: 'SC', color: '#991b1b', description: 'OR scheduling and resource allocation' },
      { type: 'instruments', label: 'SI', color: '#dc2626', description: 'Surgical instrument tracking' },
      { type: 'anesthesia', label: 'AN', color: '#b91c1c', description: 'Anesthesia monitoring and records' },
      { type: 'notes', label: 'SN', color: '#7f1d1d', description: 'Operative notes and documentation' }
    ],
    integrationChallenges: [
      'OR management system integration',
      'Surgical device data capture',
      'Real-time procedure documentation'
    ],
    standards: ['HL7 SIU^S12', 'IEEE 11073', 'FHIR Procedure Module']
  }
];

const SECURITY_THREATS = [
  { type: 'malware', color: '#dc2626', description: 'Malicious software targeting healthcare systems' },
  { type: 'phishing', color: '#ea580c', description: 'Social engineering attacks via email' },
  { type: 'ransomware', color: '#d97706', description: 'Encryption attacks on critical systems' },
  { type: 'insider', color: '#ca8a04', description: 'Unauthorized access by internal users' },
  { type: 'ddos', color: '#65a30d', description: 'Distributed denial of service attacks' }
];

enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  LEARNING = 'learning',
  DEPARTMENT_COMPLETE = 'department_complete',
  GAME_OVER = 'game_over',
  GAME_WON = 'game_won'
}

interface LearningModal {
  type: 'data' | 'threat' | 'department' | 'security';
  title: string;
  content: string;
  details: string[];
}

export default function DataManGamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentDepartment, setCurrentDepartment] = useState(0);
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 400, y: 300 });
  const [playerDirection, setPlayerDirection] = useState<Position>({ x: 0, y: 0 });
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [collectedData, setCollectedData] = useState<Set<string>>(new Set());
  const [learningModal, setLearningModal] = useState<LearningModal | null>(null);
  const [securityProtocolActive, setSecurityProtocolActive] = useState(false);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PLAYER_SIZE = 20;
  const DATA_SIZE = 12;
  const THREAT_SIZE = 16;

  const initializeGame = useCallback(() => {
    const department = DEPARTMENTS[currentDepartment];
    const newDataPoints: DataPoint[] = [];
    
    // Generate data points for current department
    department.dataTypes.forEach((dataType, index) => {
      for (let i = 0; i < 6; i++) {
        newDataPoints.push({
          id: `${dataType.type}-${i}`,
          type: dataType.type,
          position: {
            x: 100 + (i * 120) + (index * 30),
            y: 100 + (index * 100)
          },
          collected: false,
          department: department.id,
          label: dataType.label,
          color: dataType.color
        });
      }
    });

    // Generate security threats
    const newThreats: SecurityThreat[] = [];
    for (let i = 0; i < 5; i++) {
      const threatType = SECURITY_THREATS[Math.floor(Math.random() * SECURITY_THREATS.length)];
      newThreats.push({
        id: `threat-${i}`,
        type: threatType.type,
        position: {
          x: Math.random() * (CANVAS_WIDTH - 100) + 50,
          y: Math.random() * (CANVAS_HEIGHT - 100) + 50
        },
        direction: {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2
        },
        active: true,
        color: threatType.color
      });
    }

    setDataPoints(newDataPoints);
    setThreats(newThreats);
    setPlayerPosition({ x: 400, y: 300 });
    setCollectedData(new Set());
  }, [currentDepartment]);

  const showLearningModal = (modal: LearningModal) => {
    setGameState(GameState.LEARNING);
    setLearningModal(modal);
  };

  const collectData = (dataPoint: DataPoint) => {
    const department = DEPARTMENTS.find(d => d.id === dataPoint.department);
    const dataTypeInfo = department?.dataTypes.find(dt => dt.type === dataPoint.type);
    
    if (dataTypeInfo) {
      showLearningModal({
        type: 'data',
        title: `${dataTypeInfo.label} - ${dataTypeInfo.description}`,
        content: `You've collected ${dataTypeInfo.description} from the ${department?.name}`,
        details: [
          `Integration Standards: ${department?.standards.join(', ')}`,
          `Data Type: ${dataTypeInfo.type.toUpperCase()}`,
          `Department: ${department?.name}`,
          'This data is critical for healthcare workflow integration and must be handled securely according to HIPAA requirements.'
        ]
      });
    }

    setScore(prev => prev + 100);
    setCollectedData(prev => new Set(prev).add(dataPoint.id));
    
    const newDataPoints = dataPoints.map(dp => 
      dp.id === dataPoint.id ? { ...dp, collected: true } : dp
    );
    setDataPoints(newDataPoints);

    // Check if department is complete
    const departmentDataPoints = newDataPoints.filter(dp => dp.department === DEPARTMENTS[currentDepartment].id);
    const allCollected = departmentDataPoints.every(dp => dp.collected);
    
    if (allCollected) {
      setTimeout(() => {
        setGameState(GameState.DEPARTMENT_COMPLETE);
      }, 1000);
    }
  };

  const handleThreatCollision = (threat: SecurityThreat) => {
    const threatInfo = SECURITY_THREATS.find(t => t.type === threat.type);
    
    if (threatInfo && !securityProtocolActive) {
      showLearningModal({
        type: 'threat',
        title: `Security Threat: ${threat.type.toUpperCase()}`,
        content: threatInfo.description,
        details: [
          'Healthcare systems are prime targets for cyberattacks',
          'HIPAA requires appropriate safeguards against security threats',
          'Implement multi-factor authentication and encryption',
          'Regular security training for all healthcare staff is essential',
          'Data breaches can result in significant fines and patient harm'
        ]
      });

      setLives(prev => prev - 1);
      if (lives <= 1) {
        setGameState(GameState.GAME_OVER);
      }
    }
  };

  const activateSecurityProtocol = () => {
    setSecurityProtocolActive(true);
    showLearningModal({
      type: 'security',
      title: 'Security Protocol Activated',
      content: 'Advanced security measures are now protecting your data collection',
      details: [
        'Multi-Factor Authentication (MFA) enabled',
        'End-to-end encryption activated',
        'Access controls and audit logging in place',
        'Real-time threat monitoring active',
        'HIPAA compliance protocols enforced'
      ]
    });

    setTimeout(() => {
      setSecurityProtocolActive(false);
    }, 10000);
  };

  const updateGame = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;

    // Update player position
    setPlayerPosition(prev => ({
      x: Math.max(PLAYER_SIZE, Math.min(CANVAS_WIDTH - PLAYER_SIZE, prev.x + playerDirection.x * 3)),
      y: Math.max(PLAYER_SIZE, Math.min(CANVAS_HEIGHT - PLAYER_SIZE, prev.y + playerDirection.y * 3))
    }));

    // Update threats
    setThreats(prev => prev.map(threat => ({
      ...threat,
      position: {
        x: Math.max(THREAT_SIZE, Math.min(CANVAS_WIDTH - THREAT_SIZE, 
          threat.position.x + threat.direction.x * 2)),
        y: Math.max(THREAT_SIZE, Math.min(CANVAS_HEIGHT - THREAT_SIZE, 
          threat.position.y + threat.direction.y * 2))
      },
      direction: {
        x: threat.position.x <= THREAT_SIZE || threat.position.x >= CANVAS_WIDTH - THREAT_SIZE 
          ? -threat.direction.x : threat.direction.x,
        y: threat.position.y <= THREAT_SIZE || threat.position.y >= CANVAS_HEIGHT - THREAT_SIZE 
          ? -threat.direction.y : threat.direction.y
      }
    })));

    // Check collisions
    dataPoints.forEach(dataPoint => {
      if (!dataPoint.collected) {
        const distance = Math.sqrt(
          Math.pow(playerPosition.x - dataPoint.position.x, 2) +
          Math.pow(playerPosition.y - dataPoint.position.y, 2)
        );
        if (distance < PLAYER_SIZE + DATA_SIZE) {
          collectData(dataPoint);
        }
      }
    });

    // Check threat collisions
    threats.forEach(threat => {
      const distance = Math.sqrt(
        Math.pow(playerPosition.x - threat.position.x, 2) +
        Math.pow(playerPosition.y - threat.position.y, 2)
      );
      if (distance < PLAYER_SIZE + THREAT_SIZE) {
        handleThreatCollision(threat);
      }
    });
  }, [gameState, playerPosition, playerDirection, dataPoints, threats, lives, securityProtocolActive]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw department background
    const department = DEPARTMENTS[currentDepartment];
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = 'rgba(75, 85, 99, 0.3)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw data points
    dataPoints.forEach(dataPoint => {
      if (!dataPoint.collected) {
        ctx.fillStyle = dataPoint.color;
        ctx.beginPath();
        ctx.arc(dataPoint.position.x, dataPoint.position.y, DATA_SIZE, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw label
        ctx.fillStyle = 'white';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(dataPoint.label, dataPoint.position.x, dataPoint.position.y + 3);
      }
    });

    // Draw threats
    threats.forEach(threat => {
      ctx.fillStyle = securityProtocolActive ? 'rgba(156, 163, 175, 0.5)' : threat.color;
      ctx.beginPath();
      ctx.arc(threat.position.x, threat.position.y, THREAT_SIZE, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw threat indicator
      ctx.fillStyle = 'white';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚠', threat.position.x, threat.position.y + 4);
    });

    // Draw player (DataMan)
    ctx.fillStyle = securityProtocolActive ? '#10b981' : '#3b82f6';
    ctx.beginPath();
    ctx.arc(playerPosition.x, playerPosition.y, PLAYER_SIZE, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw player face
    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('◉', playerPosition.x, playerPosition.y + 5);

    if (securityProtocolActive) {
      // Draw security shield
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(playerPosition.x, playerPosition.y, PLAYER_SIZE + 10, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }, [playerPosition, dataPoints, threats, currentDepartment, securityProtocolActive]);

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      gameLoopRef.current = requestAnimationFrame(() => {
        updateGame();
        draw();
      });
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, updateGame, draw]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== GameState.PLAYING) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          setPlayerDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
          setPlayerDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
          setPlayerDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
          setPlayerDirection({ x: 1, y: 0 });
          break;
        case ' ':
          activateSecurityProtocol();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState]);

  const startGame = () => {
    setGameState(GameState.PLAYING);
    setScore(0);
    setLives(3);
    setCurrentDepartment(0);
    initializeGame();
  };

  const nextDepartment = () => {
    if (currentDepartment < DEPARTMENTS.length - 1) {
      setCurrentDepartment(prev => prev + 1);
      setGameState(GameState.PLAYING);
      initializeGame();
    } else {
      setGameState(GameState.GAME_WON);
    }
  };

  const closeLearningModal = () => {
    setLearningModal(null);
    setGameState(GameState.PLAYING);
  };

  if (gameState === GameState.MENU) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              DataMan
            </h1>
            <p className="text-xl text-gray-600">Healthcare Integration Learning Game</p>
          </div>
          
          <div className="mb-8">
            <div className="bg-blue-50 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">🎯 Mission</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Navigate through 6 hospital departments, collecting critical healthcare data while avoiding security threats. 
                Learn about real-world integration challenges, standards like HL7 and FHIR, and HIPAA compliance requirements.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-center mb-2">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <p className="font-medium">Collect Data</p>
                <p className="text-gray-600 text-xs">Learn integration concepts</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-center mb-2">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <p className="font-medium">Avoid Threats</p>
                <p className="text-gray-600 text-xs">Learn cybersecurity</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Play className="h-5 w-5" />
              Start Learning Adventure
            </button>
            
            <p className="text-xs text-gray-500">
              Use WASD or arrow keys to move • Spacebar for security protocol
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === GameState.LEARNING && learningModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl w-full">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              {learningModal.type === 'data' && <Database className="h-12 w-12 text-blue-600" />}
              {learningModal.type === 'threat' && <AlertTriangle className="h-12 w-12 text-red-600" />}
              {learningModal.type === 'security' && <Shield className="h-12 w-12 text-green-600" />}
              {learningModal.type === 'department' && <Info className="h-12 w-12 text-purple-600" />}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{learningModal.title}</h2>
            <p className="text-gray-600">{learningModal.content}</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Learning Points:</h3>
            <ul className="space-y-2">
              {learningModal.details.map((detail, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-blue-600 font-bold">•</span>
                  {detail}
                </li>
              ))}
            </ul>
          </div>
          
          <button
            onClick={closeLearningModal}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Continue Game
          </button>
        </div>
      </div>
    );
  }

  if (gameState === GameState.DEPARTMENT_COMPLETE) {
    const department = DEPARTMENTS[currentDepartment];
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl w-full text-center">
          <div className="mb-6">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Department Complete!</h2>
            <h3 className="text-xl text-gray-600">{department.name}</h3>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">Integration Challenges Mastered:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              {department.integrationChallenges.map((challenge, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  {challenge}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">Standards Learned:</h4>
            <div className="flex flex-wrap gap-2 justify-center">
              {department.standards.map((standard, index) => (
                <span key={index} className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                  {standard}
                </span>
              ))}
            </div>
          </div>
          
          <button
            onClick={nextDepartment}
            className="bg-green-600 text-white py-3 px-8 rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            {currentDepartment < DEPARTMENTS.length - 1 ? 'Next Department' : 'Complete Game'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Game Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-800">DataMan</h1>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {DEPARTMENTS[currentDepartment].name}
              </span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="font-semibold">{score}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-500">❤️</span>
                <span className="font-semibold">{lives}</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                <span className="text-sm">
                  {dataPoints.filter(dp => dp.collected).length}/{dataPoints.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border border-gray-200 rounded-lg mx-auto block"
          />
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setGameState(GameState.PAUSED)}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Pause className="h-4 w-4" />
                Pause
              </button>
              <button
                onClick={startGame}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Restart
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              Use WASD or arrows to move • Spacebar for security protocol
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}