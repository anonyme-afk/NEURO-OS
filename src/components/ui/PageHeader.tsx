import React from 'react';

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function PageHeader({ icon, title, description }: PageHeaderProps) {
  return (
    <header>
      <h1 className="text-3xl font-bold tracking-tight glow-text text-white flex items-center gap-3">
        {icon}
        {title}
      </h1>
      <p className="text-[#6B7A99] font-mono text-sm mt-2">{description}</p>
    </header>
  );
}
