import {cn} from '@/lib/utils';
import {Loader2Icon} from 'lucide-react';

export interface SpinnerProps {
  className?: string;
  active?: boolean;
  full?: boolean;
  size?: 'sm' | 'md' | 'lg';
  muted?: boolean;
}

export function Spinner(props: SpinnerProps): JSX.Element {
  const size = props.size ?? 'md';
  const className = cn(props.className, {
    'animate-spin': props.active !== false,
    'size-4': size === 'sm',
    'size-6': size === 'md',
    'size-8': size === 'lg',
    'stroke-muted-foreground': props.muted === true,
  });

  if (props.full) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2Icon className={className} />
      </div>
    );
  }

  return <Loader2Icon className={className} />;
}
