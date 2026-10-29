import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const VoiceContext = createContext(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

// Minimal valid 1-second silent WAV base64 to maintain mobile Android/iOS background audio service
const SILENT_AUDIO_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

export function VoiceProvider({ children }) {
  const { user } = useAuth();

  const [roomId, setRoomId] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [roomCredentials, setRoomCredentials] = useState({ customRoomId: '', customPassword: '' });
  const [isConnected, setIsConnected] = useState(false);
  const [peers, setPeers] = useState(new Map()); // socketId -> peerObj
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [ping, setPing] = useState(24);

  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const backgroundAudioRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // socketId -> RTCPeerConnection
  const candidateQueuesRef = useRef(new Map()); // socketId -> queued RTCIceCandidateInit[]
  const audioElementsRef = useRef(new Map()); // socketId -> HTMLAudioElement
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const speechIntervalRef = useRef(null);

  // Initialize Socket.io connection once
  useEffect(() => {
    let socketUrl = 'http://localhost:5001';
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
      socketUrl = envUrl.trim().replace(/\/api\/?$/, '');
    } else if (typeof window !== 'undefined') {
      if (window.location.port === '5173') {
        socketUrl = `${window.location.protocol}//${window.location.hostname}:5001`;
      } else {
        socketUrl = window.location.origin;
      }
    }

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Voice Socket] Connected to signaling gateway at', socketUrl);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Voice Socket] Connection error:', err.message);
    });

    socket.on('disconnect', () => {
      console.log('[Voice Socket] Disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Silent keep-alive node to prevent background tab sleep
  const ensureAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      // Ultra-low volume keep-alive to ensure background playback on mobile / tabs
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.00001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      audioContextRef.current = ctx;
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  // Setup Web Audio VAD (Voice Activity Detection for Green Halo)
  const setupVoiceActivityDetection = (stream) => {
    try {
      const ctx = ensureAudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let speakingFrames = 0;

      speechIntervalRef.current = setInterval(() => {
        if (!analyserRef.current || isMuted) {
          if (isSpeaking) {
            setIsSpeaking(false);
            socketRef.current?.emit('voice:speaking-state', { roomId, isSpeaking: false });
          }
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        // Threshold for speaking
        const currentlySpeaking = average > 14;

        if (currentlySpeaking) {
          speakingFrames = Math.min(speakingFrames + 1, 10);
        } else {
          speakingFrames = Math.max(speakingFrames - 1, 0);
        }

        const newSpeakingState = speakingFrames >= 2;
        setIsSpeaking((prev) => {
          if (prev !== newSpeakingState) {
            socketRef.current?.emit('voice:speaking-state', { roomId, isSpeaking: newSpeakingState });
          }
          return newSpeakingState;
        });
      }, 100);
    } catch (e) {
      console.warn('[VAD Setup Warning]:', e.message);
    }
  };

  // Create an RTCPeerConnection for a remote peer
  const createPeerConnection = (targetSocketId, peerUser) => {
    if (peerConnectionsRef.current.has(targetSocketId)) {
      return peerConnectionsRef.current.get(targetSocketId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(targetSocketId, pc);

    // Add local mic tracks
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // ICE Candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('voice:signal', {
          targetSocketId,
          signalData: { type: 'candidate', candidate: event.candidate },
          fromUser: {
            _id: user?._id,
            name: user?.name,
            username: user?.username,
            avatar: user?.avatar
          }
        });
      }
    };

    // Remote Audio Track received
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received audio stream from ${peerUser?.username || targetSocketId}`);
      let audio = audioElementsRef.current.get(targetSocketId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audio.playsInline = true;
        audioElementsRef.current.set(targetSocketId, audio);
      }
      audio.srcObject = event.streams[0];
      if (isDeafened) {
        audio.muted = true;
      }
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((playErr) => {
          console.warn('[WebRTC Audio Autoplay Warning]:', playErr.message);
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[ICE State ${targetSocketId}]: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        // ICE restart logic if needed
      }
    };

    return pc;
  };

  // Join a Squad Voice Room
  const joinRoom = async (targetRoomId, targetRoomName = 'Squad Voice', credentials = null) => {
    if (!user) {
      setError('Please log in to join squad voice');
      return;
    }
    setError(null);

    const cleanRoomId = (targetRoomId || '').toString().trim().toLowerCase();
    if (!cleanRoomId) {
      setError('Invalid room code. Please provide a valid squad code.');
      return;
    }

    if (credentials) {
      setRoomCredentials({
        customRoomId: credentials.customRoomId || credentials.roomId || '',
        customPassword: credentials.customPassword || credentials.password || ''
      });
    }

    try {
      // 1. Acquire Local Microphone with Universal Mobile-Safe Constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      localStreamRef.current = stream;
      setupVoiceActivityDetection(stream);

      // Start silent looping audio to hook Android Background Media Service & Notification Shade
      try {
        if (!backgroundAudioRef.current && typeof Audio !== 'undefined') {
          const bgAudio = new Audio(SILENT_AUDIO_WAV);
          bgAudio.loop = true;
          bgAudio.volume = 0.0001;
          backgroundAudioRef.current = bgAudio;
        }
        if (backgroundAudioRef.current) {
          backgroundAudioRef.current.play().catch((bgErr) => {
            console.warn('[Background Audio Wake Warning]:', bgErr.message);
          });
        }
      } catch (wakeErr) {
        console.warn('[Background Audio Init Warning]:', wakeErr);
      }

      setRoomId(cleanRoomId);
      setRoomName(targetRoomName);
      setIsConnected(true);

      const socket = socketRef.current;
      if (socket && !socket.connected) {
        socket.connect();
      }
      if (!socket) return;

      // Clean old listeners
      socket.off('voice:all-peers');
      socket.off('voice:peer-joined');
      socket.off('voice:signal');
      socket.off('voice:user-speaking');
      socket.off('voice:user-mute-state');
      socket.off('voice:peer-left');

      // 2. Received list of existing peers -> Initiate WebRTC Offers
      socket.on('voice:all-peers', async ({ peers: existingPeers }) => {
        const peerMap = new Map();
        for (const peer of existingPeers) {
          peerMap.set(peer.socketId, peer);
          const pc = createPeerConnection(peer.socketId, peer.user);

          // Create Offer
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('voice:signal', {
              targetSocketId: peer.socketId,
              signalData: { type: 'offer', sdp: offer },
              fromUser: {
                _id: user._id,
                name: user.name,
                username: user.username,
                avatar: user.avatar
              }
            });
          } catch (offerErr) {
            console.error('[WebRTC Offer Error]:', offerErr);
          }
        }
        setPeers(peerMap);
      });

      // 3. New peer joined while we are in room
      socket.on('voice:peer-joined', (newPeer) => {
        setPeers((prev) => {
          const next = new Map(prev);
          next.set(newPeer.socketId, newPeer);
          return next;
        });
        createPeerConnection(newPeer.socketId, newPeer.user);
      });

      // Helper to flush queued candidates
      const flushCandidateQueue = async (socketId, peerConn) => {
        const queued = candidateQueuesRef.current.get(socketId) || [];
        for (const cand of queued) {
          try {
            await peerConn.addIceCandidate(new RTCIceCandidate(cand));
          } catch (candErr) {
            console.warn('[WebRTC Candidate Flush Error]:', candErr);
          }
        }
        candidateQueuesRef.current.delete(socketId);
      };

      // 4. Relay Signals (Offer / Answer / Candidate)
      socket.on('voice:signal', async ({ fromSocketId, signalData, fromUser }) => {
        let pc = peerConnectionsRef.current.get(fromSocketId);
        if (!pc) {
          pc = createPeerConnection(fromSocketId, fromUser);
        }

        try {
          if (signalData.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
            await flushCandidateQueue(fromSocketId, pc);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('voice:signal', {
              targetSocketId: fromSocketId,
              signalData: { type: 'answer', sdp: answer },
              fromUser: {
                _id: user._id,
                name: user.name,
                username: user.username,
                avatar: user.avatar
              }
            });
          } else if (signalData.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
            await flushCandidateQueue(fromSocketId, pc);
          } else if (signalData.type === 'candidate' && signalData.candidate) {
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
            } else {
              // Queue candidate until setRemoteDescription completes
              if (!candidateQueuesRef.current.has(fromSocketId)) {
                candidateQueuesRef.current.set(fromSocketId, []);
              }
              candidateQueuesRef.current.get(fromSocketId).push(signalData.candidate);
            }
          }
        } catch (sigErr) {
          console.error('[WebRTC Signal Process Error]:', sigErr);
        }
      });

      // 5. Remote peer speaking
      socket.on('voice:user-speaking', ({ socketId, isSpeaking: remoteSpeaking }) => {
        setPeers((prev) => {
          if (!prev.has(socketId)) return prev;
          const next = new Map(prev);
          const peer = { ...next.get(socketId), isSpeaking: remoteSpeaking };
          next.set(socketId, peer);
          return next;
        });
      });

      // 6. Remote peer mute / deafen state
      socket.on('voice:user-mute-state', ({ socketId, isMuted: remoteMuted, isDeafened: remoteDeafened }) => {
        setPeers((prev) => {
          if (!prev.has(socketId)) return prev;
          const next = new Map(prev);
          const peer = { ...next.get(socketId), isMuted: remoteMuted, isDeafened: remoteDeafened };
          next.set(socketId, peer);
          return next;
        });
      });

      // 7. Peer Left Room
      socket.on('voice:peer-left', ({ socketId }) => {
        // Close and clean peer connection
        const pc = peerConnectionsRef.current.get(socketId);
        if (pc) {
          pc.close();
          peerConnectionsRef.current.delete(socketId);
        }
        // Remove audio element
        const audio = audioElementsRef.current.get(socketId);
        if (audio) {
          audio.srcObject = null;
          audioElementsRef.current.delete(socketId);
        }
        setPeers((prev) => {
          const next = new Map(prev);
          next.delete(socketId);
          return next;
        });
      });

      // Emit join event to server
      socket.emit('voice:join-room', {
        roomId: cleanRoomId,
        roomName: targetRoomName,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          avatar: user.avatar
        }
      });

      // Random healthy ping simulation (20-35ms)
      setPing(Math.floor(20 + Math.random() * 15));
    } catch (err) {
      console.error('[Microphone Access Error]:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone permission blocked. Please enable microphone access in your browser to speak with teammates.');
      } else {
        setError(err.message || 'Failed to initialize voice communication');
      }
      leaveRoom();
    }
  };

  // Toggle Microphone Mute
  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const newMuted = !audioTrack.enabled;
      setIsMuted(newMuted);
      socketRef.current?.emit('voice:mute-state', {
        roomId,
        isMuted: newMuted,
        isDeafened
      });
    }
  };

  // Toggle Deafen (Mutes all incoming audio)
  const toggleDeafen = () => {
    const nextDeafened = !isDeafened;
    setIsDeafened(nextDeafened);

    // Mute or unmute all remote audio tags
    audioElementsRef.current.forEach((audio) => {
      audio.muted = nextDeafened;
    });

    // Automatically mute mic if deafened
    if (nextDeafened && !isMuted) {
      toggleMute();
    }

    socketRef.current?.emit('voice:mute-state', {
      roomId,
      isMuted: nextDeafened ? true : isMuted,
      isDeafened: nextDeafened
    });
  };

  // Leave Voice Room and release hardware
  const leaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit('voice:leave-room');
    }

    // Stop silent background audio
    if (backgroundAudioRef.current) {
      try {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current.currentTime = 0;
      } catch (e) {}
    }

    // Clear Android MediaSession Notification
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      } catch (e) {}
    }

    // Stop and release mic tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close all P2P connections
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    candidateQueuesRef.current.clear();

    // Clean audio elements
    audioElementsRef.current.forEach((audio) => {
      audio.srcObject = null;
    });
    audioElementsRef.current.clear();

    // Clear speech detection
    if (speechIntervalRef.current) {
      clearInterval(speechIntervalRef.current);
      speechIntervalRef.current = null;
    }

    setRoomId(null);
    setRoomName('');
    setRoomCredentials({ customRoomId: '', customPassword: '' });
    setIsConnected(false);
    setPeers(new Map());
    setIsSpeaking(false);
    setIsMuted(false);
    setIsDeafened(false);
  };

  // Keep latest refs to avoid stale closures in Android MediaSession action callbacks
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const toggleMuteRef = useRef(toggleMute);
  toggleMuteRef.current = toggleMute;

  const toggleDeafenRef = useRef(toggleDeafen);
  toggleDeafenRef.current = toggleDeafen;

  const leaveRoomRef = useRef(leaveRoom);
  leaveRoomRef.current = leaveRoom;

  // Sync Android MediaSession Notification Controls
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    if (isConnected) {
      const activeMembers = 1 + peers.size;
      const credsText = roomCredentials?.customRoomId
        ? `Room: #${roomCredentials.customRoomId}${roomCredentials.customPassword ? ' | Pass: ' + roomCredentials.customPassword : ''}`
        : `Room Code: ${roomId || 'Active'}`;

      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: roomName || 'LobbyIT Squad Comms',
          artist: credsText,
          album: `${isMuted ? '🔴 Mic Muted' : '🟢 Mic LIVE'} • ${activeMembers} in squad`,
          artwork: [
            { src: '/images/lobbyit-icon.png', sizes: '96x96', type: 'image/png' },
            { src: '/images/lobbyit-icon.png', sizes: '192x192', type: 'image/png' },
            { src: '/images/lobbyit-icon.png', sizes: '512x512', type: 'image/png' },
            { src: '/favicon.png', sizes: '128x128', type: 'image/png' }
          ]
        });

        navigator.mediaSession.playbackState = isMuted ? 'paused' : 'playing';

        navigator.mediaSession.setActionHandler('play', () => {
          if (isMutedRef.current) toggleMuteRef.current();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          if (!isMutedRef.current) toggleMuteRef.current();
        });
        navigator.mediaSession.setActionHandler('stop', () => {
          leaveRoomRef.current();
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          toggleDeafenRef.current();
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          toggleMuteRef.current();
        });
      } catch (err) {
        console.warn('[MediaSession Registration Warning]:', err);
      }
    } else {
      try {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      } catch (e) {}
    }
  }, [isConnected, isMuted, isDeafened, roomId, roomName, peers.size, roomCredentials]);

  return (
    <VoiceContext.Provider
      value={{
        roomId,
        roomName,
        roomCredentials,
        setRoomCredentials,
        isConnected,
        peers,
        isMuted,
        isDeafened,
        isSpeaking,
        error,
        ping,
        joinRoom,
        leaveRoom,
        toggleMute,
        toggleDeafen
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export const useVoice = () => useContext(VoiceContext);
