'use client';

import {Button} from '@/components/ui/button';
import {Confetti, type ConfettiRef} from '@/components/ui/confetti';
import Link from 'next/link';
import {useRef} from 'react';

export default function Page() {
  const ref = useRef<ConfettiRef>(null);

  return (
    <div className="size-full flex items-center justify-center flex-col">
      <header className="mb-12">
        <div className="flex items-center justify-center">
          <h1 className="text-6xl font-extrabold">Congrats!</h1>

          <Confetti
            ref={ref}
            className="absolute left-1/5 -ml-1/2 top-0 z-0 size-full"
            onMouseEnter={() => {
              ref.current?.fire({});
            }}
          />
        </div>
        <h2></h2>
      </header>
      <div className="z-50 relative">
        <Button asChild>
          <Link href="/"> Get Started</Link>
        </Button>
      </div>
    </div>
  );
}
