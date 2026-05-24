export interface AmbientEvent {
  type: "sigh" | "cry" | "silence" | "keyword" | "loud_noise"
  confidence: number
  label: string
}

type AmbientCallback = (event: AmbientEvent) => void

export class AmbientListener {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private mediaStream: MediaStream | null = null
  private animationId: number | null = null
  private speechRecognition: SpeechRecognition | null = null
  private isListening = false
  private onTrigger: AmbientCallback | null = null
  private silenceStart: number | null = null
  private lastSoundTime = Date.now()
  private sighPatternBuffer: number[] = []
  private keywordTriggers = [
    "não aguento", "não consigo", "triste", "sozinho", "só", "chateado",
    "cansado", "estressado", "ansioso", "preocupado", "medo",
    "i can't", "i'm sad", "lonely", "stressed", "anxious", "afraid",
    "no puedo", "triste", "solo", "estresado", "ansioso", "miedo",
  ]

  constructor(onTrigger?: AmbientCallback) {
    if (onTrigger) {
      this.onTrigger = onTrigger
    }
  }

  setOnTrigger(callback: AmbientCallback) {
    this.onTrigger = callback
  }

  async start() {
    if (this.isListening) return

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      this.audioContext = new AudioContext()
      const source = this.audioContext.createMediaStreamSource(this.mediaStream)
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
      source.connect(this.analyser)

      this.isListening = true
      this.lastSoundTime = Date.now()
      this.startAudioAnalysis()
      this.startKeywordDetection()
    } catch {
      console.warn("AmbientListener: could not access microphone")
    }
  }

  stop() {
    this.isListening = false

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    if (this.speechRecognition) {
      this.speechRecognition.onresult = null
      this.speechRecognition.onerror = null
      this.speechRecognition.onend = null
      try { this.speechRecognition.abort() } catch {}
      this.speechRecognition = null
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop())
      this.mediaStream = null
    }

    this.analyser = null
    this.silenceStart = null
    this.sighPatternBuffer = []
  }

  private startAudioAnalysis() {
    if (!this.analyser) return
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount)

    const analyze = () => {
      if (!this.isListening || !this.analyser) return
      this.analyser.getByteTimeDomainData(dataArray)

      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        const value = (dataArray[i] - 128) / 128
        sum += value * value
      }
      const rms = Math.sqrt(sum / dataArray.length)

      const now = Date.now()

      if (rms > 0.08) {
        this.lastSoundTime = now
        this.silenceStart = null
        this.sighPatternBuffer.push(rms)

        if (this.sighPatternBuffer.length > 60) {
          this.sighPatternBuffer.shift()
        }

        if (rms > 0.3 && this.sighPatternBuffer.length > 5) {
          const recent = this.sighPatternBuffer.slice(-5)
          const avg = recent.reduce((a, b) => a + b, 0) / recent.length
          if (avg > 0.15 && avg < 0.35 && rms > avg * 1.8) {
            this.trigger({ type: "sigh", confidence: Math.min(1, rms * 2), label: "Suspiro detectado" })
            this.sighPatternBuffer = []
          }
        }

        if (rms > 0.5) {
          this.trigger({ type: "loud_noise", confidence: Math.min(1, rms * 1.5), label: "Som alto detectado" })
        }
      } else {
        if (this.silenceStart === null) {
          this.silenceStart = now
        } else if (now - this.silenceStart > 15000) {
          this.trigger({ type: "silence", confidence: 0.7, label: "Silêncio prolongado" })
          this.silenceStart = now
        }
      }

      this.animationId = requestAnimationFrame(analyze)
    }

    this.animationId = requestAnimationFrame(analyze)
  }

  private startKeywordDetection() {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "pt-BR"
    recognition.maxAlternatives = 3

    recognition.onresult = (event) => {
      const fullText = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .toLowerCase()

      for (const keyword of this.keywordTriggers) {
        if (fullText.includes(keyword)) {
          this.trigger({ type: "keyword", confidence: 0.8, label: `Palavra-chave: "${keyword}"` })
          break
        }
      }
    }

    recognition.onerror = () => {}
    recognition.onend = () => {
      if (this.isListening) {
        try { recognition.start() } catch {}
      }
    }

    recognition.start()
    this.speechRecognition = recognition
  }

  private trigger(event: AmbientEvent) {
    this.onTrigger?.(event)
  }
}
