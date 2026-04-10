export const MEDIA_FOLDER_PATH = '/media';
export const MEDIA_IMAGE_URL = `${MEDIA_FOLDER_PATH}/image.jpg`;
export const MEDIA_AUDIO_URL = `${MEDIA_FOLDER_PATH}/audio.mp3`;

function withCacheBust(url: string): string {
  return `${url}?t=${Date.now()}`;
}

export function getSegmentId(value: number): number {
  return Math.max(0, value - 1);
}

export function getSegmentBackgroundPosition(
  segmentId: number,
  segmentCount: number,
): string {
  if (segmentCount <= 1) {
    return '50% 50%';
  }

  const x = (segmentId / (segmentCount - 1)) * 100;
  return `${x}% 50%`;
}

export async function loadImageAsset(
  url = MEDIA_IMAGE_URL,
): Promise<string> {
  const requestUrl = withCacheBust(url);

  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(requestUrl);
    image.onerror = () =>
      reject(new Error(`Image asset is missing at ${url}`));
    image.src = requestUrl;
  });
}

export async function checkAudioAsset(
  url = MEDIA_AUDIO_URL,
): Promise<string> {
  const response = await fetch(withCacheBust(url), {
    method: 'HEAD',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Audio asset is missing at ${url}`);
  }

  return url;
}
