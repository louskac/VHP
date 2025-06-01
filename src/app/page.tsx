'use client';

import { useState, useEffect } from 'react';
import VHPCaptcha from '../components/VHPCaptcha';
import ThematicContainer from '../components/ui/ThematicContainer';

interface CompletedChallenge {
  id: string;
  transactionId: string;
  challenge: {
    title: string;
    description: string;
    challengerName: string;
  };
  recipient: {
    address: string;
    amount: number;
  };
  media: {
    videoCID: string;
    photoCID: string;
    videoURL: string;
    photoURL: string;
  };
  verification: {
    score: number;
    confidence: number;
  };
  timestamp: string;
}

export default function VHPMainPage() {
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState<CompletedChallenge[]>([]);
  const [hoveredChallenge, setHoveredChallenge] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Load completed challenges from server
  useEffect(() => {
    loadCompletedChallenges();
  }, []);

  const loadCompletedChallenges = async () => {
    try {
      console.log('🔍 Starting to load completed challenges...');
      
      const response = await fetch('/api/save-transaction?action=onchain');
      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()));
      
      const result = await response.json();
      console.log('📦 Full API Result:', result);
      
      // Store debug info
      setDebugInfo({
        apiStatus: response.status,
        apiResponse: result,
        timestamp: new Date().toISOString()
      });
      
      if (result.success) {
        console.log('✅ API call successful');
        console.log('📊 Transactions from storage:', result.transactions);
        console.log('⛓️ On-chain data:', result.onChainData);
        console.log('🔍 On-chain data type:', typeof result.onChainData);
        console.log('🔍 Is on-chain data array?', Array.isArray(result.onChainData));
        
        if (result.onChainData && Array.isArray(result.onChainData) && result.onChainData.length > 0) {
          console.log(`📈 Processing ${result.onChainData.length} on-chain records`);
          
          const formattedChallenges = result.onChainData.map((data: any, index: number) => {
            console.log(`🔄 Processing challenge ${index}:`, data);
            
            // Extract challenge data from blockchain events
            let recipientAddress = 'Unknown';
            let rewardAmount = 0;
            let challengeVideoCID = '';
            let challengePhotoCID = '';
            
            // Look for Nocenix token deposit events to find recipient and amount
            if (data.events && Array.isArray(data.events)) {
              const nocenixDeposit = data.events.find((event: any) => 
                event.type === 'A.9a0766d93b6608b7.FungibleToken.Deposited' &&
                event.data?.type === 'A.a622afad07f6739e.Nocenix.Vault'
              );
              
              if (nocenixDeposit) {
                recipientAddress = nocenixDeposit.data.to || 'Unknown';
                rewardAmount = parseFloat(nocenixDeposit.data.amount || '0');
                console.log(`💰 Found reward: ${rewardAmount} VHP to ${recipientAddress}`);
              }
            }
            
            // Look for challenge data in logs - this is where video CIDs should be stored
            if (data.logs && Array.isArray(data.logs)) {
              console.log(`🔍 Searching for video CID in ${data.logs.length} logs for transaction ${data.transactionId}`);
              console.log(`📦 Raw logs data:`, data.logs);
              
              // First, try to parse as JSON events
              data.logs.forEach((log: string, logIndex: number) => {
                console.log(`📄 Raw log ${logIndex}:`, log);
                try {
                  const logData = JSON.parse(log);
                  console.log(`📄 Parsed log ${logIndex}:`, logData);
                  
                  // Look for any log that might contain video/media information
                  if (logData.data && typeof logData.data === 'object') {
                    console.log(`🔍 Checking log data:`, logData.data);
                    
                    // Check if this log contains media information
                    if (logData.data.videoCID || logData.data.video || logData.data.media) {
                      challengeVideoCID = logData.data.videoCID || logData.data.video || '';
                      challengePhotoCID = logData.data.photoCID || logData.data.photo || '';
                      console.log(`🎥 Found media CIDs - Video: ${challengeVideoCID}, Photo: ${challengePhotoCID}`);
                    }
                    
                    // Also check for any field that might contain IPFS/Storacha CIDs
                    Object.keys(logData.data).forEach(key => {
                      const value = logData.data[key];
                      console.log(`🔑 Checking key "${key}" with value:`, value);
                      if (typeof value === 'string' && (value.startsWith('Qm') || value.startsWith('bafy') || value.length === 46)) {
                        console.log(`🔗 Potential CID found in ${key}: ${value}`);
                        if (key.toLowerCase().includes('video') && !challengeVideoCID) {
                          challengeVideoCID = value;
                        } else if (key.toLowerCase().includes('photo') && !challengePhotoCID) {
                          challengePhotoCID = value;
                        }
                      }
                    });
                  }
                } catch (e) {
                  // Log might be a plain text log from your enhanced transaction
                  console.log(`📄 Log ${logIndex} is plain text:`, log.substring(0, 200));
                  
                  // Parse your custom challenge metadata logs
                  if (log.includes('Video CID:')) {
                    const match = log.match(/Video CID:\s*([a-zA-Z0-9]+)/);
                    if (match && match[1]) {
                      challengeVideoCID = match[1];
                      console.log(`🎥 Found Video CID in log: ${challengeVideoCID}`);
                    }
                  }
                  
                  if (log.includes('Photo CID:')) {
                    const match = log.match(/Photo CID:\s*([a-zA-Z0-9]+)/);
                    if (match && match[1]) {
                      challengePhotoCID = match[1];
                      console.log(`📸 Found Photo CID in log: ${challengePhotoCID}`);
                    }
                  }
                  
                  // Also check for Storacha URLs in logs
                  if (log.includes('Video permanently stored') && log.includes('https://')) {
                    const urlMatch = log.match(/https:\/\/[^\s]+/);
                    if (urlMatch && urlMatch[0] && !challengeVideoCID) {
                      const url = urlMatch[0];
                      console.log(`🎥 Found Video URL in log: ${url}`);
                      // Extract CID from URL like https://QmXXX.ipfs.w3s.link
                      const cidMatch = url.match(/https:\/\/([a-zA-Z0-9]+)\.ipfs/);
                      if (cidMatch && cidMatch[1]) {
                        challengeVideoCID = cidMatch[1];
                        console.log(`🎥 Extracted Video CID from URL: ${challengeVideoCID}`);
                      }
                    }
                  }
                  
                  if (log.includes('Photo permanently stored') && log.includes('https://')) {
                    const urlMatch = log.match(/https:\/\/[^\s]+/);
                    if (urlMatch && urlMatch[0] && !challengePhotoCID) {
                      const url = urlMatch[0];
                      console.log(`📸 Found Photo URL in log: ${url}`);
                      // Extract CID from URL
                      const cidMatch = url.match(/https:\/\/([a-zA-Z0-9]+)\.ipfs/);
                      if (cidMatch && cidMatch[1]) {
                        challengePhotoCID = cidMatch[1];
                        console.log(`📸 Extracted Photo CID from URL: ${challengePhotoCID}`);
                      }
                    }
                  }
                }
              });
            } else {
              console.log(`⚠️ No logs found in blockchain data`);
            }
            
            // Also check events for any media data
            if (data.events && Array.isArray(data.events)) {
              console.log(`🔍 Also checking ${data.events.length} events for media data`);
              data.events.forEach((event: any, eventIndex: number) => {
                console.log(`📅 Event ${eventIndex}:`, event);
                if (event.data && typeof event.data === 'object') {
                  Object.keys(event.data).forEach(key => {
                    const value = event.data[key];
                    if (typeof value === 'string' && (value.startsWith('Qm') || value.startsWith('bafy') || value.length === 46)) {
                      console.log(`🔗 Potential CID found in event ${eventIndex}, key "${key}": ${value}`);
                    }
                  });
                }
              });
            }
            
            // Check if the entire data object has any potential CIDs
            console.log(`🔍 Checking entire data object for CIDs:`, data);
            const dataString = JSON.stringify(data);
            const cidMatches = dataString.match(/\b(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[0-9a-z]{55})\b/g);
            if (cidMatches) {
              console.log(`🎯 Found potential CIDs in data:`, cidMatches);
              if (!challengeVideoCID && cidMatches.length > 0) {
                challengeVideoCID = cidMatches[0]; // Use the first CID found
                console.log(`🎥 Using first CID as video: ${challengeVideoCID}`);
              }
            }
            
            // Construct Storacha URLs if we have CIDs
            let videoURL = '';
            let photoURL = '';
            
            if (challengeVideoCID) {
              // Use your Storacha gateway URL
              videoURL = `https://w3s.link/ipfs/${challengeVideoCID}`;
              console.log(`🎥 Constructed video URL: ${videoURL}`);
            } else {
              console.log(`⚠️ No video CID found for transaction ${data.transactionId}`);
              // For demo purposes, use a working sample video until video CIDs are properly stored
              // Replace this with actual challenge video CID extraction
              videoURL = 'https://www.w3schools.com/html/mov_bbb.mp4';
              console.log(`🎭 Using demo video for visualization: ${videoURL}`);
            }
            
            if (challengePhotoCID) {
              photoURL = `https://w3s.link/ipfs/${challengePhotoCID}`;
              console.log(`📸 Constructed photo URL: ${photoURL}`);
            }
            
            return {
              id: `challenge-${index}`,
              transactionId: data.transactionId || 'unknown',
              challenge: data.challenge || {
                title: 'VHP Human Verification',
                description: 'AI-verified human challenge completed successfully',
                challengerName: 'VHP AI System'
              },
              recipient: data.recipient || {
                address: recipientAddress,
                amount: rewardAmount
              },
              media: data.media || {
                videoCID: challengeVideoCID,
                photoCID: challengePhotoCID,
                videoURL: videoURL,
                photoURL: photoURL
              },
              verification: data.verification || {
                score: 85 + (parseInt(data.transactionId.slice(-2), 16) % 15), // Fixed score based on transaction
                confidence: 90 + (parseInt(data.transactionId.slice(-3, -1), 16) % 10) // Fixed confidence
              },
              timestamp: data.timestamp || new Date().toISOString()
            };
          });
          
          console.log('🎯 Final formatted challenges:', formattedChallenges);
          setCompletedChallenges(formattedChallenges);
        } else if (result.success && result.transactions && result.transactions.length > 0) {
          // Fallback: Create mock challenges from storage transactions
          console.log('⚠️ Using fallback mock data for visualization');
          console.log('💾 Available transactions:', result.transactions);
          
          const mockChallenges = result.transactions.map((transaction: any, index: number) => ({
            id: `challenge-${index}`,
            transactionId: transaction.transactionId,
            challenge: {
              title: 'VHP Human Verification',
              description: 'AI-verified human challenge completed',
              challengerName: 'VHP AI System'
            },
            recipient: {
              address: '0x' + transaction.transactionId.slice(0, 40), // Mock address from tx ID
              amount: 10 // Mock amount
            },
            media: {
              videoCID: '',
              photoCID: '',
              videoURL: '', // Empty will show gradient fallback
              photoURL: ''
            },
            verification: {
              score: 85 + Math.floor(Math.random() * 15), // Mock score 85-99%
              confidence: 90 + Math.floor(Math.random() * 10) // Mock confidence 90-99%
            },
            timestamp: transaction.timestamp
          }));
          
          setCompletedChallenges(mockChallenges);
          console.log('🎭 Created mock challenges:', mockChallenges);
        } else {
          console.log('⚠️ No on-chain data found and no transactions in storage');
          console.log('🔍 On-chain data value:', result.onChainData);
          console.log('🔍 Transactions value:', result.transactions);
        }
      } else {
        console.error('❌ API call failed:', result.error);
        console.error('📋 Error details:', result);
      }
    } catch (error: any) {
      console.error('💥 Error loading completed challenges:', error);
      console.error('📋 Error details:', error?.message || 'Unknown error');
      console.error('🔍 Error stack:', error?.stack || 'No stack trace');
      
      // Ultimate fallback: Create one mock challenge for testing
      console.log('🆘 Creating ultimate fallback challenge for testing');
      const fallbackChallenge = [{
        id: 'challenge-fallback',
        transactionId: '925ab59c8fade10ca11e59aacc6b99a779e021eb28542d256e182ffbe7814441',
        challenge: {
          title: 'VHP Verification Complete',
          description: 'Human verification successful',
          challengerName: 'VHP AI'
        },
        recipient: {
          address: '0x925ab59c8fade10ca11e59a',
          amount: 10
        },
        media: {
          videoCID: '',
          photoCID: '',
          videoURL: '',
          photoURL: ''
        },
        verification: {
          score: 92,
          confidence: 95
        },
        timestamp: new Date().toISOString()
      }];
      
      setCompletedChallenges(fallbackChallenge);
      
      setDebugInfo({
        error: error?.message || 'Unknown error',
        fallbackUsed: true,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Test API endpoints directly
  const testAPIEndpoints = async () => {
    try {
      console.log('🧪 Testing API endpoints directly...');
      
      // Test basic storage
      console.log('🗄️ Testing basic storage...');
      const storageResponse = await fetch('/api/save-transaction');
      const storageResult = await storageResponse.json();
      console.log('💾 Storage data:', storageResult);
      
      // Test on-chain fetching
      console.log('⛓️ Testing on-chain fetching...');
      const onChainResponse = await fetch('/api/save-transaction?action=onchain');
      const onChainResult = await onChainResponse.json();
      console.log('⛓️ On-chain data:', onChainResult);
      
      // Test stats
      console.log('📊 Testing stats...');
      const statsResponse = await fetch('/api/save-transaction?action=stats');
      const statsResult = await statsResponse.json();
      console.log('📊 Stats data:', statsResult);
      
      // Test recent transactions
      console.log('🕒 Testing recent transactions...');
      const recentResponse = await fetch('/api/save-transaction?action=recent&limit=5');
      const recentResult = await recentResponse.json();
      console.log('🕒 Recent data:', recentResult);
      
      setDebugInfo((prev: any) => ({
        ...prev,
        apiTests: {
          storage: storageResult,
          onChain: onChainResult,
          stats: statsResult,
          recent: recentResult,
          timestamp: new Date().toISOString()
        }
      }));
      
    } catch (error: any) {
      console.error('🧪 API test failed:', error);
      setDebugInfo((prev: any) => ({
        ...prev,
        apiTestError: error?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }));
    }
  };

  const handleVerified = (token: string) => {
    console.log('✅ User verified with token:', token);
    setShowCaptcha(false);
    // Reload challenges to show any new completions
    setTimeout(() => {
      loadCompletedChallenges();
    }, 1000);
  };

  const handleFailed = (error: string) => {
    console.error('❌ Verification failed:', error);
  };

  const getFloatingPosition = (index: number) => {
    const positions = [
      { top: '10%', left: '15%', delay: '0s' },
      { top: '25%', right: '20%', delay: '0.5s' },
      { top: '45%', left: '10%', delay: '1s' },
      { top: '60%', right: '15%', delay: '1.5s' },
      { top: '20%', left: '50%', delay: '2s' },
      { top: '70%', left: '60%', delay: '2.5s' },
      { top: '35%', right: '45%', delay: '3s' },
      { top: '80%', left: '25%', delay: '3.5s' },
    ];
    return positions[index % positions.length];
  };

  const getChallengeColor = (score: number): 'nocenaGreen' | 'nocenaBlue' | 'nocenaPurple' | 'nocenaRed' => {
    if (score >= 80) return 'nocenaGreen';
    if (score >= 60) return 'nocenaBlue';
    if (score >= 40) return 'nocenaPurple';
    return 'nocenaRed';
  };

  const formatAddress = (address: string) => {
    if (!address || address === 'Unknown') return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black relative overflow-hidden">
      {/* Debug Panel */}
      {showDebug && (
        <div className="fixed top-4 right-4 bg-black/90 text-white p-4 rounded-lg max-w-md max-h-96 overflow-auto z-50 text-xs">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Debug Info</h3>
            <button 
              onClick={() => setShowDebug(false)}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      {/* Debug Controls */}
      <div className="fixed top-4 left-4 space-y-2 z-40">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
        >
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </button>
        <button
          onClick={testAPIEndpoints}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs block"
        >
          Test APIs
        </button>
        <button
          onClick={loadCompletedChallenges}
          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs block"
        >
          Reload Challenges
        </button>
      </div>

      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent animate-pulse"></div>
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(147, 51, 234, 0.1) 1px, transparent 1px),
              linear-gradient(rgba(147, 51, 234, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        ></div>
      </div>

      {/* Floating Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-pink-500/10 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        {/* VHP Logo/Title */}
        <div className="text-center mb-12">
          <div className="relative">
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent mb-4">
              VHP
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-25 animate-pulse"></div>
          </div>
          <p className="text-xl md:text-2xl text-gray-300 font-light tracking-wide">
            Verified Human Protocol
          </p>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            Prove your humanity through AI-verified challenges on the blockchain
          </p>
        </div>

        {/* Main CTA Button */}
        <ThematicContainer
          asButton={true}
          onClick={() => setShowCaptcha(true)}
          color="nocenaPurple"
          rounded="xl"
          glassmorphic={true}
          className="px-8 py-4 text-lg font-medium text-white hover:scale-105 transition-transform duration-300 relative group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span>Start Human Verification</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </ThematicContainer>

        {/* Stats */}
        {completedChallenges.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              {completedChallenges.length} humans verified • {completedChallenges.reduce((sum, c) => sum + c.recipient.amount, 0)} VHP tokens distributed
            </p>
          </div>
        )}
        
        {/* Debug Info Display */}
        {completedChallenges.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-yellow-400 text-sm">
              No challenges loaded yet. Check console logs or click "Show Debug" for details.
            </p>
          </div>
        )}
      </div>

      {/* Floating Completed Challenges */}
      {completedChallenges.map((challenge, index) => {
        const position = getFloatingPosition(index);
        const isHovered = hoveredChallenge === challenge.id;
        
        return (
          <div
            key={challenge.id}
            className="fixed w-48 h-36 transition-all duration-700 hover:scale-110 hover:z-50 cursor-pointer animate-float"
            style={{
              ...position,
              animationDelay: position.delay,
              perspective: '1000px'
            }}
            onMouseEnter={() => setHoveredChallenge(challenge.id)}
            onMouseLeave={() => setHoveredChallenge(null)}
          >
            <div 
              className="relative w-full h-full transition-transform duration-700"
              style={{
                transformStyle: 'preserve-3d',
                transform: isHovered ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
            {/* Front Side - Video */}
            <div 
              className="absolute inset-0 w-full h-full"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(0deg)'
              }}
            >
              <ThematicContainer
                asButton={false}
                color={getChallengeColor(challenge.verification.score)}
                rounded="xl"
                glassmorphic={true}
                className="w-full h-full p-2 relative overflow-hidden"
              >
                {challenge.media.videoURL ? (
                  <video
                    src={challenge.media.videoURL}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover rounded-lg"
                    onLoadStart={() => console.log(`🎥 Video loading: ${challenge.id}`)}
                    onCanPlay={() => console.log(`✅ Video ready: ${challenge.id}`)}
                    onError={(e) => {
                      console.log(`❌ Video failed to load for ${challenge.id}:`, e);
                    }}
                  />
                ) : (
                  // Fallback gradient when no video
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
                    
                    <div className="absolute top-2 left-2 w-6 h-6 bg-black/30 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    
                    <div className="text-white text-xs text-center px-2 relative z-10">
                      <div className="font-semibold">{challenge.challenge.title}</div>
                      <div className="text-xs opacity-75 mt-1">{challenge.verification.score}% verified</div>
                      <div className="text-xs opacity-60 mt-1">Video Challenge</div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-blue-400 animate-pulse"></div>
                  </div>
                )}
                
                {/* Verification Badge */}
                <div className="absolute top-1 right-1 bg-black/70 rounded-full px-2 py-1">
                  <span className="text-xs text-white font-medium">
                    {challenge.verification.score}%
                  </span>
                </div>
              </ThematicContainer>
            </div>

            {/* Back Side - Metadata */}
            <div 
              className="absolute inset-0 w-full h-full"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <ThematicContainer
                asButton={false}
                color={getChallengeColor(challenge.verification.score)}
                rounded="xl"
                glassmorphic={true}
                className="w-full h-full p-3 relative"
              >
                <div className="text-white text-xs space-y-1">
                  <div className="font-semibold text-sm truncate">
                    {challenge.challenge.title}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Human:</span>
                    <span className="font-mono text-xs">
                      {formatAddress(challenge.recipient.address)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Reward:</span>
                    <span className="text-green-400 font-medium">
                      {challenge.recipient.amount} VHP
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">AI Score:</span>
                    <span className="text-blue-400 font-medium">
                      {challenge.verification.score}%
                    </span>
                  </div>
                  
                  <div className="text-gray-400 text-xs truncate">
                    {challenge.challenge.challengerName}
                  </div>
                  
                  <div className="text-gray-500 text-xs">
                    {new Date(challenge.timestamp).toLocaleDateString()}
                  </div>

                  {/* Transaction Hash */}
                  <div className="pt-1 border-t border-gray-600">
                    <div className="text-gray-500 text-xs font-mono truncate">
                      {challenge.transactionId.slice(0, 8)}...
                    </div>
                  </div>
                </div>
              </ThematicContainer>
            </div>
            </div>
          </div>
        );
      })}

      {/* Floating Animation Keyframes */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(1deg); }
          50% { transform: translateY(-5px) rotate(-1deg); }
          75% { transform: translateY(-15px) rotate(0.5deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delay-1 {
          animation: float 6s ease-in-out infinite;
          animation-delay: 1s;
        }
        
        .animate-float-delay-2 {
          animation: float 6s ease-in-out infinite;
          animation-delay: 2s;
        }
        
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>

      {/* Add floating animation classes */}
      <div className="hidden">
        {completedChallenges.map((_, index) => (
          <div key={index} className={`animate-float${index % 3 === 1 ? '-delay-1' : index % 3 === 2 ? '-delay-2' : ''}`} />
        ))}
      </div>

      {/* VHP Captcha Popup */}
      <VHPCaptcha
        isOpen={showCaptcha}
        onClose={() => setShowCaptcha(false)}
        onVerified={handleVerified}
        onFailed={handleFailed}
      />
    </main>
  );
}