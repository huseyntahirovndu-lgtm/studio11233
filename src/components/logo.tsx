import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Logo(props: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="https://i.ibb.co/1wN1rhJ/NAX-VAN-D-VL-T-UN-VERS-TET-N-N-N-ZD-ND-G-MNAZ-YA.png"
      alt="Naxçıvan Dövlət Universiteti Logo"
      {...props}
      className={cn("h-10 w-auto", props.className)}
    />
  );
}
