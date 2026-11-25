import { APP_NAME } from '@/lib/brand';

interface BrandHeaderProps {
  tagline: string;
}

export default function BrandHeader({ tagline }: BrandHeaderProps) {
  return (
    <header className="brand-header" data-testid="brand-header">
      <div className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <h1 className="brand-title">{APP_NAME}</h1>
      <p className="brand-tagline">{tagline}</p>
    </header>
  );
}
