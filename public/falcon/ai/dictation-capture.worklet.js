class FalconDictationCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(2048);
    this.filled = 0;
    this.total = 0;
    this.maximum = Math.floor(sampleRate * 60);
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
  process(inputs, outputs) {
    for (const output of outputs) for (const channel of output) channel.fill(0);
    const channels = inputs[0];
    if (!this.active || !channels?.length) return true;
    for (let frame = 0; frame < channels[0].length && this.total < this.maximum; frame++) {
      let mono = 0;
      for (const channel of channels) mono += channel[frame] || 0;
      this.buffer[this.filled++] = mono / channels.length;
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
