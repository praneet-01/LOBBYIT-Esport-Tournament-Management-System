import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  Headphones, 
  VolumeX, 
  PhoneOff, 
  Copy, 
  Check, 
  Users, 
  Signal, 
  ShieldAlert, 
  Radio, 
  Sparkles, 
  PlusCircle,
  ArrowRight,
  Gamepad2,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useVoice } from '../../context/VoiceContext';

export default function TeamVoiceHub() {
  const { roomId: urlRoomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    roomId, 
    roomName, 
    isConnected, 
    peers, 
    isMuted, 
    isDeafened, 
    isSpeaking, 
    ping,
    error,
    joinRoom, 
    leaveRoom, 
    toggleMute, 
    toggleDeafen 
  } = useVoice();

  const [inputRoomName, setInputRoomName] = useState(user?.teamName || `${user?.username || 'Team'}'s Comms`);
  const [inputRoomCode, setInputRoomCode] = useState(urlRoomId || '');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState(urlRoomId ? 'join' : 'create');
  const [isConnecting, setIsConnecting] = useState(false);

  // If URL has a roomId and we are not connected to it yet, prefill room code
  useEffect(() => {
    if (urlRoomId && !isConnected) {
      setInputRoomCode(urlRoomId);
      setActiveTab('join');
    }
  }, [urlRoomId, isConnected]);

  const handleCreateRoom = async () => {
    try {
      setIsConnecting(true);
      const generatedId = `squad-${Date.now().toString(36).slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;
      await joinRoom(generatedId, inputRoomName || 'Squad Voice');
      navigate(`/team-voice/${generatedId}`, { replace: true });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleJoinRoom = async () => {
    let cleanId = inputRoomCode.trim();
    if (!cleanId) return;
    if (cleanId.includes('/team-voice/')) {
      cleanId = cleanId.split('/team-voice/')[1].split(/[?#]/)[0];
    }
    try {
      setIsConnecting(true);
      await joinRoom(cleanId, `Squad Comms (${cleanId})`);
      navigate(`/team-voice/${cleanId}`, { replace: true });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}/team-voice/${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const remotePeersList = Array.from(peers.values());
  const totalCallCount = 1 + remotePeersList.length;

  return (
    <div className="min-h-[88vh] bg-[#07090E] text-slate-100 px-4 py-8 flex flex-col justify-between">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        
        {/* Error / Permission Modal */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 flex items-start gap-3 shadow-lg">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white">Microphone Access Error</h4>
              <p className="text-xs text-red-300 mt-1">{error}</p>
              <p className="text-[11px] text-slate-400 mt-2">
                Tip: Click the microphone lock icon 🔒 next to your browser URL address bar and change permission to <strong>Allow</strong>.
              </p>
            </div>
          </div>
        )}

        {/* CONNECTED STATE: Discord Full Squad Room */}
        {isConnected ? (
          <div className="flex-1 flex flex-col justify-between space-y-6">
            {/* Room Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0F1420] border border-white/10 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white font-gaming tracking-wide uppercase">
                      {roomName}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                      LIVE COMMS
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 font-mono">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <Signal className="w-3.5 h-3.5" /> {ping}ms (P2P Mesh)
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {totalCallCount} Connected
                    </span>
                    <span>•</span>
                    <span>ID: {roomId}</span>
                  </div>
                </div>
              </div>

              {/* Quick Invite Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyInvite}
                  className="px-4 py-2 rounded-xl bg-[#171E30] hover:bg-[#1E263C] text-slate-200 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" /> Copied Link!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-cyan-400" /> Invite Teammates
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Teammate Voice Grid (Discord Style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 items-stretch py-2">
              {/* Local User Card */}
              <div className={`relative p-6 rounded-2xl bg-[#0D121D] border transition-all flex flex-col items-center justify-center text-center shadow-lg ${
                isSpeaking && !isMuted
                  ? 'border-emerald-500 shadow-emerald-500/20 ring-4 ring-emerald-500/20'
                  : 'border-white/10'
              }`}>
                {/* Speaking Halo Avatar */}
                <div className="relative mb-3">
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}`}
                    alt={user?.name}
                    className={`w-20 h-20 rounded-full object-cover border-2 transition-all ${
                      isSpeaking && !isMuted 
                        ? 'border-emerald-400 ring-4 ring-emerald-400/50 scale-105' 
                        : 'border-white/20'
                    }`}
                  />
                  {isMuted && (
                    <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-red-600 text-white shadow-md">
                      <MicOff className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {isDeafened && (
                    <span className="absolute top-0 right-0 p-1.5 rounded-full bg-red-600 text-white shadow-md">
                      <VolumeX className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  {user?.name} <span className="text-[10px] text-cyan-400 uppercase font-semibold">(You)</span>
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">@{user?.username}</p>

                {/* Animated Equalizer Wave Bar */}
                <div className="mt-3 flex items-center gap-1 h-3">
                  {isSpeaking && !isMuted ? (
                    <>
                      <span className="w-1 bg-emerald-400 rounded-full h-full animate-pulse"></span>
                      <span className="w-1 bg-emerald-400 rounded-full h-2/3 animate-pulse delay-75"></span>
                      <span className="w-1 bg-emerald-400 rounded-full h-full animate-pulse delay-150"></span>
                      <span className="w-1 bg-emerald-400 rounded-full h-1/2 animate-pulse"></span>
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">
                      {isMuted ? 'Muted' : 'Silent'}
                    </span>
                  )}
                </div>
              </div>

              {/* Remote Teammates Cards */}
              {remotePeersList.map((peer) => {
                const peerSpeaking = peer.isSpeaking && !peer.isMuted;
                return (
                  <div
                    key={peer.socketId}
                    className={`relative p-6 rounded-2xl bg-[#0D121D] border transition-all flex flex-col items-center justify-center text-center shadow-lg ${
                      peerSpeaking
                        ? 'border-emerald-500 shadow-emerald-500/20 ring-4 ring-emerald-500/20'
                        : 'border-white/10'
                    }`}
                  >
                    <div className="relative mb-3">
                      <img
                        src={peer.user?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${peer.user?.username}`}
                        alt={peer.user?.name}
                        className={`w-20 h-20 rounded-full object-cover border-2 transition-all ${
                          peerSpeaking 
                            ? 'border-emerald-400 ring-4 ring-emerald-400/50 scale-105' 
                            : 'border-white/20'
                        }`}
                      />
                      {peer.isMuted && (
                        <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-red-600 text-white shadow-md">
                          <MicOff className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {peer.isDeafened && (
                        <span className="absolute top-0 right-0 p-1.5 rounded-full bg-red-600 text-white shadow-md">
                          <VolumeX className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white">{peer.user?.name}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">@{peer.user?.username}</p>

                    <div className="mt-3 flex items-center gap-1 h-3">
                      {peerSpeaking ? (
                        <>
                          <span className="w-1 bg-emerald-400 rounded-full h-full animate-pulse"></span>
                          <span className="w-1 bg-emerald-400 rounded-full h-2/3 animate-pulse delay-75"></span>
                          <span className="w-1 bg-emerald-400 rounded-full h-full animate-pulse delay-150"></span>
                          <span className="w-1 bg-emerald-400 rounded-full h-1/2 animate-pulse"></span>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">
                          {peer.isMuted ? 'Muted' : 'Connected'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Waiting for Teammates Slot Card */}
              {remotePeersList.length < 3 && (
                <div 
                  onClick={handleCopyInvite}
                  className="p-6 rounded-2xl bg-[#0D121D]/40 border-2 border-dashed border-white/10 hover:border-cyan-500/50 transition-all flex flex-col items-center justify-center text-center cursor-pointer group"
                >
                  <div className="w-14 h-14 rounded-full bg-white/5 group-hover:bg-cyan-500/10 flex items-center justify-center mb-3 text-slate-500 group-hover:text-cyan-400 transition-colors">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <h5 className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                    Invite Teammate #{totalCallCount + 1}
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Click to copy room link & PIN
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Discord Controls Toolbar */}
            <div className="p-4 rounded-2xl bg-[#0F1420] border border-white/10 shadow-2xl flex items-center justify-center gap-4">
              {/* Mic Mute Button */}
              <button
                onClick={toggleMute}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md ${
                  isMuted
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : isSpeaking
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400'
                      : 'bg-[#1A2234] hover:bg-[#222C44] text-slate-200 hover:text-white'
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isMuted ? 'Muted' : 'Mute Mic'}</span>
              </button>

              {/* Deafen Button */}
              <button
                onClick={toggleDeafen}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md ${
                  isDeafened
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-[#1A2234] hover:bg-[#222C44] text-slate-200 hover:text-white'
                }`}
              >
                {isDeafened ? <VolumeX className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                <span>{isDeafened ? 'Deafened' : 'Deafen'}</span>
              </button>

              {/* Leave Room Button */}
              <button
                onClick={leaveRoom}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md ml-2"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        ) : (
          /* LOBBY / JOIN OR CREATE STATE */
          <div className="max-w-md mx-auto my-auto w-full py-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Radio className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white font-gaming tracking-wide uppercase">
                Squad Voice Comms
              </h2>
              <p className="text-xs text-slate-400">
                Ultra-low latency Discord-style voice chat for teammates. Runs seamlessly in the background with zero game lag.
              </p>
            </div>

            {/* Card */}
            <div className="bg-[#0F1420] rounded-2xl p-6 sm:p-7 border border-white/10 shadow-2xl space-y-5">
              {/* Tab Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/40 border border-white/10 text-xs font-bold uppercase tracking-wider">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`py-2.5 rounded-lg transition-all ${
                    activeTab === 'create'
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Room
                </button>
                <button
                  onClick={() => setActiveTab('join')}
                  className={`py-2.5 rounded-lg transition-all ${
                    activeTab === 'join'
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Join via Code
                </button>
              </div>

              {activeTab === 'create' ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Squad Voice Room Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. GodLike BGMI Comms"
                      value={inputRoomName}
                      onChange={(e) => setInputRoomName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090C13] border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-emerald-300 leading-relaxed">
                    ⚡ <strong>Opus Audio Mesh</strong>: Hardware noise suppression enabled. Audio streams directly between players without touching intermediate servers.
                  </div>

                  <button
                    onClick={handleCreateRoom}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 font-gaming flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Mic className="w-4 h-4" /> Start Squad Voice Room
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Enter Room Code or Invite Link
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. squad-a91z-824"
                      value={inputRoomCode}
                      onChange={(e) => setInputRoomCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090C13] border border-white/15 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <button
                    onClick={handleJoinRoom}
                    disabled={!inputRoomCode.trim() || isConnecting}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 font-gaming flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isConnecting ? (
                      <>
                        <Radio className="w-4 h-4 animate-spin text-black" />
                        <span>Connecting to Mic & Call...</span>
                      </>
                    ) : (
                      <>
                        <span>Connect to Call</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
