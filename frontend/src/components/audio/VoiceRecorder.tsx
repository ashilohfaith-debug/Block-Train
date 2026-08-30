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
    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm mt-4 shadow-xl">
      <h3 className="text-emerald-400 font-bold uppercase text-sm mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
        Admin Voice Dispatch Override
      </h3>
      
      <p className="text-zinc-400 text-xs mb-4">
        Record an emergency voice message. When the AI schedules a block, all workers in that department will be called by Twilio and this audio will play.
      </p>

      <div className="flex items-center gap-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="bg-red-900/50 hover:bg-red-600 text-red-500 hover:text-white border border-red-900/50 hover:border-red-500 px-4 py-2 rounded-sm text-sm font-bold transition-colors flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            REC
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-red-600 text-white border border-red-500 px-4 py-2 rounded-sm text-sm font-bold transition-colors flex items-center gap-2 animate-pulse"
          >
            <div className="w-2 h-2 bg-white"></div>
            STOP
          </button>
        )}

        {isUploading && (
          <span className="text-zinc-500 text-xs uppercase animate-pulse">Uploading to Dispatch Server...</span>
        )}

        {audioUrl && !isUploading && (
          <div className="flex items-center gap-2 text-emerald-500 text-xs uppercase font-bold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            Voice Payload Armed
          </div>
        )}
      </div>
    </div>
  );
};
