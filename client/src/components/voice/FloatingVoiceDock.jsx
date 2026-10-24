import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  Headphones, 
  VolumeX, 
  PhoneOff, 
  Radio, 
  ExternalLink,
  Users,
  Signal
} from 'lucide-react';
import { useVoice } from '../../context/VoiceContext';

export default function FloatingVoiceDock() {
  const { 
    isConnected, 
    roomId, 
    roomName, 
    peers, 
    isMuted, 
    isDeafened, 
    isSpeaking, 
    ping,
    toggleMute, 
    toggleDeafen, 
    leaveRoom 
  } = useVoice();

  const navigate = useNavigate();
  const location = useLocation();

  // Hide the floating dock if not connected to any room, or if already on the full voice hub page
  if (!isConnected || location.pathname.startsWith('/team-voice')) {
    return null;
  }

  const totalMembers = 1 + peers.size; // local user + remote peers

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 bg-[#0E131F]/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-2.5 px-4 shadow-2xl shadow-emerald-950/50 animate-slide-up transition-all">
      {/* Voice Status Pill */}
      <div 
        onClick={() => navigate(`/team-voice/${roomId}`)}
        className="flex items-center gap-2.5 cursor-pointer group pr-2 border-r border-white/10"
        title="Click to open Full Squad Voice Hub"
      >
        <div className="relative">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>

        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-wider">
              {roomName || 'Squad Voice'}
            </span>
            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-white" />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Signal className="w-2.5 h-2.5" /> {ping}ms
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users className="w-2.5 h-2.5" /> {totalMembers} in call
            </span>
          </div>
        </div>
      </div>

      {/* Mic Speaking Indicator & Controls */}
      <div className="flex items-center gap-1.5">
        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className={`p-2 rounded-xl transition-all ${
            isMuted 
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' 
              : isSpeaking
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400 animate-pulse'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Deafen Button */}
        <button
          onClick={toggleDeafen}
          className={`p-2 rounded-xl transition-all ${
            isDeafened 
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' 
              : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title={isDeafened ? 'Undeafen' : 'Deafen (Mute incoming sound)'}
        >
          {isDeafened ? <VolumeX className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
        </button>

        {/* Disconnect Button */}
        <button
          onClick={leaveRoom}
          className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all shadow-md ml-1"
          title="Disconnect from Squad Call"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
