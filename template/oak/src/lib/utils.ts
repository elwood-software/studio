import {type ClassValue, clsx} from 'clsx';
import {twMerge} from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - hours * 3600) / 60);
  seconds = seconds - hours * 3600 - minutes * 60;
  return [hours, minutes, seconds];
}

export function formatTime(seconds: Array<number>, totalSeconds = seconds) {
  const totalWithoutLeadingZeroes = totalSeconds.slice(
    totalSeconds.findIndex(x => x !== 0),
  );
  return seconds
    .slice(seconds.length - totalWithoutLeadingZeroes.length)
    .map(x => x.toString().padStart(2, '0'))
    .join(':');
}

export function formatHumanTime(seconds: number) {
  const [h, m, s] = parseTime(seconds);
  return `${h} hour${h === 1 ? '' : 's'}, ${m} minute${
    m === 1 ? '' : 's'
  }, ${s} second${s === 1 ? '' : 's'}`;
}
interface Dimensions {
  width: number;
  height: number;
}

export function resizeMaintainAspectRatio(
  originalWidth: number,
  originalHeight: number,
  newWidth?: number,
  newHeight?: number,
): Dimensions {
  if (newWidth && !newHeight) {
    const aspectRatio = originalHeight / originalWidth;
    return {
      width: newWidth,
      height: newWidth * aspectRatio,
    };
  } else if (newHeight && !newWidth) {
    const aspectRatio = originalWidth / originalHeight;
    return {
      width: newHeight * aspectRatio,
      height: newHeight,
    };
  } else {
    throw new Error(
      'You must provide either newWidth or newHeight, but not both.',
    );
  }
}
