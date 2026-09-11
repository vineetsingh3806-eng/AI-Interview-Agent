"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface SpeechControls {
  speak: (text: string) => void;
  stop: () => void;
  readonly isSpeaking: boolean;
  readonly supported: boolean;
}

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  if (!("speechSynthesis" in window)) return null;
  return window.speechSynthesis;
}

function getSpeechUtterance(): typeof SpeechSynthesisUtterance | null {
  if (typeof window === "undefined") return null;
  return "SpeechSynthesisUtterance" in window
    ? window.SpeechSynthesisUtterance
    : null;
}

function pickEnglishVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  // Prefer a natural English voice, but never depend on a particular
  // operating-system/provider voice name.
  return (
    voices.find((voice) => /^en[-_]US$/i.test(voice.lang)) ||
    voices.find((voice) => /^en[-_]GB$/i.test(voice.lang)) ||
    voices.find((voice) => /^en[-_]/i.test(voice.lang)) ||
    voices.find((voice) => /^en/i.test(voice.lang))
  );
}

export function useSpeech(): SpeechControls {
  const [supported, setSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const utteranceIdRef = useRef(0);

  useEffect(() => {
    const synthesis = getSpeechSynthesis();
    const Utterance = getSpeechUtterance();

    if (!synthesis || !Utterance) {
      setSupported(false);
      return;
    }

    setSupported(true);

    const loadVoices = () => {
      voicesRef.current = synthesis.getVoices();
    };

    loadVoices();
    synthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      synthesis.removeEventListener("voiceschanged", loadVoices);
      synthesis.cancel();
      utteranceIdRef.current += 1;
      setIsSpeaking(false);
    };
  }, []);

  const stop = useCallback(() => {
    const synthesis = getSpeechSynthesis();

    // Increment the generation so callbacks from an old utterance cannot
    // change the speaking state after a newer utterance has started.
    utteranceIdRef.current += 1;

    if (synthesis) {
      synthesis.cancel();
    }

    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    const synthesis = getSpeechSynthesis();
    const Utterance = getSpeechUtterance();
    const cleanText = text.trim();

    if (!synthesis || !Utterance || !cleanText) return;

    // There should only ever be one active Aria utterance.
    synthesis.cancel();

    const utteranceId = utteranceIdRef.current + 1;
    utteranceIdRef.current = utteranceId;

    const utterance = new Utterance(cleanText);
    const voices = voicesRef.current.length
      ? voicesRef.current
      : synthesis.getVoices();
    const voice = pickEnglishVoice(voices);

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      // Let the browser choose its default voice if no English voice exists.
      utterance.lang = "en-US";
    }

    // Natural professional interviewer pacing.
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      if (utteranceId === utteranceIdRef.current) {
        setIsSpeaking(true);
      }
    };

    const finish = () => {
      if (utteranceId === utteranceIdRef.current) {
        setIsSpeaking(false);
      }
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    synthesis.speak(utterance);
  }, []);

  return { speak, stop, isSpeaking, supported };
}
