import type { ReactNode } from 'react';
import Navigation from '../../components/Navigation';
import SiteFooter from '../../components/SiteFooter';

type Props = {
  title: string;
  children: ReactNode;
};

export default function LegalPageLayout({ title, children }: Props) {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto px-4 py-12 max-w-3xl text-gray-300 leading-relaxed">
          <h1 className="text-4xl font-bold text-white mb-8">{title}</h1>
          {children}
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
