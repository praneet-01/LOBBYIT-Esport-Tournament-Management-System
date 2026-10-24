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

export function VoiceProvider({ children }) {
  const { user } = useAuth();

  const [roomId, setRoomId] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [peers, setPeers] = useState(new Map()); // socketId -> peerObj
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [ping, setPing] = useState(24);

  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // socketId -> RTCPeerConnection
  const audioElementsRef = useRef(new Map()); // socketId -> HTMLAudioElement
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const speechIntervalRef = useRef(null);

  // Initialize Socket.io connection once
  useEffect(() => {
    const socket = io('http://localhost:5001', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Voice Socket] Connected to signaling gateway');
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
  const joinRoom = async (targetRoomId, targetRoomName = 'Squad Voice') => {
    if (!user) {
      setError('Please log in to join squad voice');
      return;
    }
    setError(null);

    try {
      // 1. Acquire Local Microphone with Hardware Filtering
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1, // Mono for minimum bandwidth
          sampleRate: 48000
        },
        video: false
      });
      localStreamRef.current = stream;
      setupVoiceActivityDetection(stream);

      setRoomId(targetRoomId);
      setRoomName(targetRoomName);
      setIsConnected(true);

      const socket = socketRef.current;
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

      // 4. Relay Signals (Offer / Answer / Candidate)
      socket.on('voice:signal', async ({ fromSocketId, signalData, fromUser }) => {
        let pc = peerConnectionsRef.current.get(fromSocketId);
        if (!pc) {
          pc = createPeerConnection(fromSocketId, fromUser);
        }

        try {
          if (signalData.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
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
          } else if (signalData.type === 'candidate' && signalData.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
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
        roomId: targetRoomId,
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

    // Stop and release mic tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close all P2P connections
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

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
    setIsConnected(false);
    setPeers(new Map());
    setIsSpeaking(false);
    setIsMuted(false);
    setIsDeafened(false);
  };

  return (
    <VoiceContext.Provider
      value={{
        roomId,
        roomName,
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
