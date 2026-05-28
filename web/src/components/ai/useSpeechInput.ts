import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const FN_URL = `${SUPABASE_URL}/functions/v1/ai-task-assistant`

const SILENCE_THRESHOLD = 0.015   // RMS below this = silence
const SILENCE_DURATION_MS = 1800  // auto-stop after this long silence
const MIN_SPEECH_MS = 400         // ignore recordings shorter than this

const hasSpeechRecognition =
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

type SpeechInputState = {
  listening: boolean
  transcript: string
  supported: boolean
  error: string | null
  /** 0–1 amplitude for wave animation, only while listening */
  amplitude: number
}

type BrowserSpeechRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

export function useSpeechInput(
  lang: string,
  onTranscript: (text: string) => void,
  onAutoSend?: () => void,
) {
  const [state, setState] = useState<SpeechInputState>({
    listening: false,
    transcript: '',
    supported: hasSpeechRecognition,
    error: null,
    amplitude: 0,
  })

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startTimeRef = useRef<number>(0)
  const animFrameRef = useRef<number>(0)
  const onAutoSendRef = useRef(onAutoSend)
  onAutoSendRef.current = onAutoSend

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
      if (mediaRef.current?.state === 'recording') mediaRef.current.stop()
      audioCtxRef.current?.close()
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  // Attach AudioContext analyser to a stream for amplitude + silence detection
  const attachAnalyser = useCallback((stream: MediaStream, onSilence: () => void) => {
    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    ctx.createMediaStreamSource(stream).connect(analyser)
    audioCtxRef.current = ctx
    analyserRef.current = analyser

    const buf = new Float32Array(analyser.fftSize)
    let lastSoundAt = Date.now()

    const tick = () => {
      analyser.getFloatTimeDomainData(buf)
      let rms = 0
      for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i]
      rms = Math.sqrt(rms / buf.length)

      setState((s) => ({ ...s, amplitude: Math.min(1, rms / 0.15) }))

      if (rms > SILENCE_THRESHOLD) {
        lastSoundAt = Date.now()
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = null
        }
      } else if (!silenceTimerRef.current && Date.now() - startTimeRef.current > MIN_SPEECH_MS) {
        silenceTimerRef.current = setTimeout(() => {
          silenceTimerRef.current = null
          onSilence()
        }, SILENCE_DURATION_MS)
      }

      animFrameRef.current = requestAnimationFrame(tick)
    }
    animFrameRef.current = requestAnimationFrame(tick)
    return lastSoundAt
  }, [])

  const stopAnalyser = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    analyserRef.current = null
    setState((s) => ({ ...s, amplitude: 0 }))
  }, [])

  const startWebSpeech = useCallback(() => {
    const Rec = (window as unknown as {
      SpeechRecognition?: new () => BrowserSpeechRecognition
      webkitSpeechRecognition?: new () => BrowserSpeechRecognition
    }).SpeechRecognition ??
      (window as unknown as {
        SpeechRecognition?: new () => BrowserSpeechRecognition
        webkitSpeechRecognition?: new () => BrowserSpeechRecognition
      }).webkitSpeechRecognition
    if (!Rec) return

    const rec = new Rec()
    rec.lang = lang.startsWith('ru') ? 'ru-RU' : lang
    rec.continuous = false
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onstart = () => {
      startTimeRef.current = Date.now()
      setState((s) => ({ ...s, listening: true, transcript: '', error: null }))
    }

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const interim = Array.from(e.results).map((r) => r[0].transcript).join('')
      setState((s) => ({ ...s, transcript: interim }))
      if (e.results[e.results.length - 1].isFinal) {
        onTranscript(interim)
        onAutoSendRef.current?.()
      }
    }

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      setState((s) => ({ ...s, listening: false, error: e.error, amplitude: 0 }))
    }

    rec.onend = () => setState((s) => ({ ...s, listening: false, amplitude: 0 }))

    recognitionRef.current = rec
    rec.start()
  }, [lang, onTranscript])

  const startWhisper = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        stopAnalyser()
        setState((s) => ({ ...s, listening: false }))

        const blob = new Blob(chunksRef.current, { type: mimeType })
        if (blob.size < 1000) return

        try {
          const base64 = await blobToBase64(blob)
          const session = await supabase?.auth.getSession()
          const jwt = session?.data.session?.access_token ?? ''

          const resp = await fetch(FN_URL, {
            method: 'POST',
            headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'transcribe', audio_base64: base64, mime_type: mimeType, lang }),
          })

          if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
          const data = (await resp.json()) as { text?: string }
          if (data.text) {
            setState((s) => ({ ...s, transcript: data.text! }))
            onTranscript(data.text)
            onAutoSendRef.current?.()
          }
        } catch {
          setState((s) => ({ ...s, error: 'transcription_failed' }))
        }
      }

      startTimeRef.current = Date.now()
      mediaRef.current = recorder
      recorder.start()
      setState((s) => ({ ...s, listening: true, transcript: '', error: null }))

      attachAnalyser(stream, () => {
        if (mediaRef.current?.state === 'recording') mediaRef.current.stop()
      })
    } catch {
      setState((s) => ({ ...s, error: 'microphone_denied' }))
    }
  }, [onTranscript, attachAnalyser, stopAnalyser])

  const start = useCallback(() => {
    if (hasSpeechRecognition) startWebSpeech()
    else void startWhisper()
  }, [startWebSpeech, startWhisper])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    if (mediaRef.current?.state === 'recording') mediaRef.current.stop()
    stopAnalyser()
  }, [stopAnalyser])

  const toggle = useCallback(() => {
    if (state.listening) stop()
    else start()
  }, [state.listening, start, stop])

  return { ...state, start, stop, toggle }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '')
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
