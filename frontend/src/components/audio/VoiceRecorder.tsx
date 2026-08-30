'use client';

import React, { useState, useRef } from 'react';
import { useMaintenanceStore } from '../../lib/store';

export const VoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Save audio url to store so Chatbot can send it
  const setDispatchAudioUrl = useMaintenanceStore((state: any) => state.setDispatchAudioUrl);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        
        // Upload to backend
        setIsUploading(true);
        const formData = new FormData();
        formData.append('audio', audioBlob, 'dispatch-voice.mp3');

        try {
          // Use Next.js Serverless Function to upload directly to Cloudinary
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (data.success) {
            setAudioUrl(data.audioUrl);
            if (setDispatchAudioUrl) {
              // Now that we are using Cloudinary, data.audioUrl is a fully qualified public HTTPS URL!
              setDispatchAudioUrl(data.audioUrl); 
            }
          }
        } catch (err) {
          console.error("Audio upload failed", err);
        } finally {
          setIsUploading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAudioUrl(null);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all tracks to release mic
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl h-full flex flex-col justify-between shadow-inner">
      <div>
        <h3 className="text-emerald-400 font-bold uppercase text-[11px] tracking-wider mb-2 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Emergency Voice Broadcast
        </h3>
        
        <p className="text-zinc-500 text-[11px] leading-relaxed mb-6 font-mono">
          Record verbal safety instructions. Upon block confirmation, an automated voice dispatch will immediately dial all active field personnel in the assigned department and broadcast this message.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-6 gap-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="group relative w-16 h-16 rounded-full bg-red-950 flex items-center justify-center border-2 border-red-900 hover:border-red-500 hover:bg-red-900 transition-all shadow-[0_0_15px_rgba(220,38,38,0.15)] hover:shadow-[0_0_25px_rgba(220,38,38,0.3)]"
          >
            <div className="w-5 h-5 rounded-full bg-red-500 group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center border-2 border-red-500 animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.5)]"
          >
            <div className="w-5 h-5 bg-white rounded-sm"></div>
          </button>
        )}

        <div className="h-6 flex items-center justify-center">
          {isRecording && <span className="text-red-500 text-xs font-bold uppercase tracking-widest animate-pulse">Recording...</span>}
          {!isRecording && !audioUrl && !isUploading && <span className="text-zinc-600 text-xs font-mono tracking-widest">TAP TO RECORD</span>}
          {isUploading && <span className="text-amber-500 text-xs uppercase animate-pulse font-bold tracking-widest">Uploading...</span>}
          {audioUrl && !isUploading && (
            <div className="flex items-center gap-2 text-emerald-500 text-xs uppercase font-bold tracking-widest bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-900/50">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Payload Armed
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
