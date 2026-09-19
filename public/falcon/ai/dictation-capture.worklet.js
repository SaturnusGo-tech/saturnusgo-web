class FalconDictationCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(2048);
    this.filled = 0;
    this.total = 0;
    this.maximum = Math.floor(sampleRate * 300);
    this.active = true;
    this.port.onmessage = (event) => {
      if (event.data?.type !== "stop") return;
      this.active = false;
      this.flush();
      this.port.postMessage({ type: "stopped" });
    };
  }
  flush() {
    if (!this.filled) return;
    const samples = this.buffer.slice(0, this.filled);
    this.port.postMessage({ type: "samples", samples }, [samples.buffer]);
    this.filled = 0;
  }
  fallbackChannel(channels) {
    if (channels.length === 1) return channels[0];
    let strongest = channels[0], strongestPower = 0, mixedPower = 0;
    for (const channel of channels) {
      let power = 0;
      for (const sample of channel) power += sample * sample;
      if (power > strongestPower) { strongest = channel; strongestPower = power; }
    }
    for (let frame = 0; frame < channels[0].length; frame++) {
      let mono = 0;
      for (const channel of channels) mono += channel[frame] || 0;
      mixedPower += (mono / channels.length) ** 2;
    }
    // Some stereo microphones expose opposite polarities. Averaging can erase audible speech.
    return mixedPower < strongestPower * .1 ? strongest : null;
  }
  process(inputs, outputs) {
    for (const output of outputs) for (const channel of output) channel.fill(0);
    const channels = inputs[0];
    if (!this.active || !channels?.length) return true;
    const fallback = this.fallbackChannel(channels);
    for (let frame = 0; frame < channels[0].length && this.total < this.maximum; frame++) {
      let mono = 0;
      if (fallback) mono = fallback[frame] || 0;
      else {
        for (const channel of channels) mono += channel[frame] || 0;
        mono /= channels.length;
      }
      this.buffer[this.filled++] = mono;
      this.total++;
      if (this.filled === this.buffer.length) this.flush();
    }
    if (this.total >= this.maximum) {
      this.active = false;
      this.flush();
      this.port.postMessage({ type: "limit" });
    }
    return true;
  }
}
registerProcessor("falcon-dictation-capture", FalconDictationCapture);
