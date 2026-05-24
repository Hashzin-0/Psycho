export interface VoiceProfileData {
  version: number
  meanSpectrum: number[]
  spectra: number[][]
  wakeWordSpectrum: number[]
  fftSize: number
  sampleRate: number
  createdAt: string
  textsRecorded: number
}

export const TRAINING_TEXTS = [
  "O rato roeu a roupa do rei de Roma.",
  "A vida é feita de escolhas e consequências.",
  "Hoje o sol brilha forte no jardim.",
  "Preciso organizar meus pensamentos com calma.",
  "Psycho, me ajude a refletir sobre o meu dia.",
]

export const WAKE_WORD = "psycho"

export class VoiceProfile {
  private profile: VoiceProfileData | null = null
  private fftSize = 2048

  get isEnrolled(): boolean {
    return this.profile !== null && this.profile.meanSpectrum.length > 0
  }

  get data(): VoiceProfileData | null {
    return this.profile
  }

  load(data: VoiceProfileData) {
    this.profile = data
  }

  reset() {
    this.profile = null
  }

  async enroll(
    onProgress: (textIndex: number, phase: "recording" | "processing" | "done") => void,
  ): Promise<VoiceProfileData> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    })

    const audioContext = new AudioContext({ sampleRate: 16000 })
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = this.fftSize
    source.connect(analyser)

    const allSpectra: Float32Array<ArrayBuffer>[] = []
    const bufferLength = analyser.frequencyBinCount
    const freqData = new Float32Array(bufferLength) as unknown as Float32Array<ArrayBuffer>

    for (let i = 0; i < TRAINING_TEXTS.length; i++) {
      onProgress(i, "recording")
      const frames = await this.recordFrames(analyser, freqData, audioContext, 3000)
      onProgress(i, "processing")

      for (const frame of frames) {
        allSpectra.push(this.normalizeSpectrum(frame))
      }

      onProgress(i, "done")
      await this.sleep(300)
    }

    onProgress(TRAINING_TEXTS.length, "recording")
    const wakeWordFrames = await this.recordFrames(analyser, freqData, audioContext, 2000)
    onProgress(TRAINING_TEXTS.length, "processing")

    const wakeWordSpectrum = this.normalizeSpectrum(this.averageSpectra(wakeWordFrames))

    stream.getTracks().forEach((t) => t.stop())
    audioContext.close()

    const meanSpectrum = this.averageSpectra(allSpectra)

    this.profile = {
      version: 1,
      meanSpectrum: Array.from(meanSpectrum),
      spectra: allSpectra.map((s) => Array.from(s)),
      wakeWordSpectrum: Array.from(wakeWordSpectrum),
      fftSize: this.fftSize,
      sampleRate: 16000,
      createdAt: new Date().toISOString(),
      textsRecorded: TRAINING_TEXTS.length,
    }

    return this.profile
  }

  private recordFrames(
    analyser: AnalyserNode,
    freqData: Float32Array<ArrayBuffer>,
    audioContext: AudioContext,
    durationMs: number,
  ): Promise<Float32Array<ArrayBuffer>[]> {
    return new Promise((resolve) => {
      const frames: Float32Array<ArrayBuffer>[] = []
      const interval = 100
      let elapsed = 0

      const capture = () => {
        analyser.getFloatFrequencyData(freqData)
          frames.push(Float32Array.from(freqData))
        elapsed += interval

        if (elapsed < durationMs) {
          setTimeout(capture, interval)
        } else {
          resolve(frames)
        }
      }

      capture()
    })
  }

  private averageSpectra(spectra: Float32Array<ArrayBuffer>[]): Float32Array<ArrayBuffer> {
    if (spectra.length === 0) return new Float32Array() as Float32Array<ArrayBuffer>
    const len = spectra[0].length
    const avg = new Float32Array(len) as Float32Array<ArrayBuffer>
    for (const frame of spectra) {
      for (let i = 0; i < len; i++) {
        avg[i] += frame[i]
      }
    }
    for (let i = 0; i < len; i++) {
      avg[i] /= spectra.length
    }
    return avg
  }

  private normalizeSpectrum(spectrum: Float32Array<ArrayBuffer>): Float32Array<ArrayBuffer> {
    const linear = new Float32Array(spectrum.length) as Float32Array<ArrayBuffer>
    for (let i = 0; i < spectrum.length; i++) {
      linear[i] = Math.pow(10, spectrum[i] / 20)
    }
    let norm = 0
    for (let i = 0; i < linear.length; i++) {
      norm += linear[i] * linear[i]
    }
    norm = Math.sqrt(norm)
    if (norm > 0) {
      for (let i = 0; i < linear.length; i++) {
        linear[i] /= norm
      }
    }
    return linear
  }

  getSimilarity(frequencyData: Float32Array<ArrayBuffer>): number {
    if (!this.profile) return 0
    const linear = new Float32Array(frequencyData.length) as Float32Array<ArrayBuffer>
    for (let i = 0; i < frequencyData.length; i++) {
      linear[i] = Math.pow(10, frequencyData[i] / 20)
    }
    let norm = 0
    for (let i = 0; i < linear.length; i++) {
      norm += linear[i] * linear[i]
    }
    norm = Math.sqrt(norm)
    if (norm > 0) {
      for (let i = 0; i < linear.length; i++) {
        linear[i] /= norm
      }
    }
    const mean = this.profile.meanSpectrum
    const minLen = Math.min(linear.length, mean.length)
    let dot = 0
    let normA = 0
    let normB = 0
    for (let i = 0; i < minLen; i++) {
      dot += linear[i] * mean[i]
      normA += linear[i] * linear[i]
      normB += mean[i] * mean[i]
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB)
    return denom > 0 ? dot / denom : 0
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms))
  }
}
