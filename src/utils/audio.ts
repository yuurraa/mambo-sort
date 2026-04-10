type ActiveAudioNode = {
  source: AudioBufferSourceNode;
  gain: GainNode;
  panner?: StereoPannerNode;
};

type SegmentPlaybackRequest = {
  type: 'compare' | 'swap';
  segmentIds: number[];
  segmentCount: number;
};

type FinalPassPlaybackRequest = {
  segmentCount: number;
  onSegmentStart?: (segmentIndex: number) => void;
  onComplete?: () => void;
};

const AudioContextClass =
  window.AudioContext ||
  (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

export class SegmentAudioEngine {
  private context: AudioContext | null = null;
  private buffer: AudioBuffer | null = null;
  private loadedUrl: string | null = null;
  private activeNodes: ActiveAudioNode[] = [];
  private activeTimers: number[] = [];

  async prepare(): Promise<void> {
    if (!AudioContextClass) {
      return;
    }

    if (!this.context) {
      this.context = new AudioContextClass();
    }

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  async loadFromUrl(url: string): Promise<void> {
    await this.prepare();

    if (!this.context) {
      return;
    }

    if (this.loadedUrl === url && this.buffer) {
      return;
    }

    const response = await fetch(`${url}?t=${Date.now()}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Unable to load audio from ${url}`);
    }

    const audioData = await response.arrayBuffer();
    this.buffer = await this.context.decodeAudioData(audioData.slice(0));
    this.loadedUrl = url;
  }

  async playSegments(request: SegmentPlaybackRequest): Promise<void> {
    await this.prepare();

    if (!this.context || !this.buffer || request.segmentCount <= 0) {
      return;
    }

    const segmentDuration = this.buffer.duration / request.segmentCount;
    const previewDuration = Math.max(
      0.06,
      Math.min(segmentDuration, request.type === 'swap' ? 0.28 : 0.18),
    );
    const gap = 0.018;
    const now = this.context.currentTime;

    this.stop();

    request.segmentIds.slice(0, 2).forEach((segmentId, order) => {
      const clampedSegment = Math.min(
        Math.max(segmentId, 0),
        request.segmentCount - 1,
      );
      const startOffset = clampedSegment * segmentDuration;
      const playableDuration = Math.max(
        0.03,
        Math.min(previewDuration, this.buffer!.duration - startOffset),
      );
      const startAt = now + order * (playableDuration + gap);
      const pan =
        request.segmentCount > 1
          ? (clampedSegment / (request.segmentCount - 1)) * 2 - 1
          : 0;

      const source = this.context!.createBufferSource();
      const gain = this.context!.createGain();
      const panner =
        typeof this.context!.createStereoPanner === 'function'
          ? this.context!.createStereoPanner()
          : undefined;

      source.buffer = this.buffer;

      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(
        request.type === 'swap' ? 0.22 : 0.16,
        startAt + 0.012,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + playableDuration);

      if (panner) {
        panner.pan.setValueAtTime(pan, startAt);
        source.connect(gain);
        gain.connect(panner);
        panner.connect(this.context!.destination);
      } else {
        source.connect(gain);
        gain.connect(this.context!.destination);
      }

      source.start(startAt, startOffset, playableDuration);
      source.stop(startAt + playableDuration + 0.02);
      source.onended = () => {
        this.disconnectNode(source);
      };

      this.activeNodes.push({ source, gain, panner });
    });
  }

  async playFinalPass({
    segmentCount,
    onSegmentStart,
    onComplete,
  }: FinalPassPlaybackRequest): Promise<void> {
    await this.prepare();

    if (!this.context || !this.buffer || segmentCount <= 0) {
      return;
    }

    const segmentDuration = this.buffer.duration / segmentCount;
    const now = this.context.currentTime;

    this.stop();

    Array.from({ length: segmentCount }, (_, segmentId) => segmentId).forEach(
      (segmentId) => {
        const startOffset = segmentId * segmentDuration;
        const playableDuration = Math.max(
          0.03,
          Math.min(segmentDuration, this.buffer!.duration - startOffset),
        );
        const startAt = now + segmentId * segmentDuration;
        const fadeDuration = Math.min(0.018, playableDuration * 0.22);
        const fadeOutAt = Math.max(
          startAt + fadeDuration,
          startAt + playableDuration - fadeDuration,
        );
        const pan =
          segmentCount > 1 ? (segmentId / (segmentCount - 1)) * 2 - 1 : 0;

        const source = this.context!.createBufferSource();
        const gain = this.context!.createGain();
        const panner =
          typeof this.context!.createStereoPanner === 'function'
            ? this.context!.createStereoPanner()
            : undefined;

        source.buffer = this.buffer;

        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.2, startAt + fadeDuration);
        gain.gain.setValueAtTime(0.2, fadeOutAt);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          startAt + playableDuration,
        );

        if (panner) {
          panner.pan.setValueAtTime(pan, startAt);
          source.connect(gain);
          gain.connect(panner);
          panner.connect(this.context!.destination);
        } else {
          source.connect(gain);
          gain.connect(this.context!.destination);
        }

        source.start(startAt, startOffset, playableDuration);
        source.stop(startAt + playableDuration + 0.02);
        source.onended = () => {
          this.disconnectNode(source);
        };

        this.activeNodes.push({ source, gain, panner });

        const startTimer = window.setTimeout(() => {
          onSegmentStart?.(segmentId);
        }, Math.max(0, (startAt - now) * 1000));

        this.activeTimers.push(startTimer);
      },
    );

    const completeTimer = window.setTimeout(() => {
      onComplete?.();
    }, Math.max(0, segmentCount * segmentDuration * 1000 + 20));

    this.activeTimers.push(completeTimer);
  }

  stop(): void {
    if (this.activeTimers.length > 0) {
      this.activeTimers.forEach((timer) => {
        window.clearTimeout(timer);
      });
      this.activeTimers = [];
    }

    if (this.activeNodes.length === 0) {
      return;
    }

    const nodes = [...this.activeNodes];
    this.activeNodes = [];

    nodes.forEach((node) => {
      try {
        node.source.stop();
      } catch {
        // Source might already be stopped.
      }

      node.source.disconnect();
      node.gain.disconnect();
      node.panner?.disconnect();
    });
  }

  private disconnectNode(source: AudioBufferSourceNode): void {
    const targetIndex = this.activeNodes.findIndex(
      (node) => node.source === source,
    );

    if (targetIndex === -1) {
      return;
    }

    const [node] = this.activeNodes.splice(targetIndex, 1);
    node.source.disconnect();
    node.gain.disconnect();
    node.panner?.disconnect();
  }
}
