import { ReactNode } from 'react';
import { StitchLayout } from './stitch/Layout';

interface AdminLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  restaurantName?: string;
}

export function AdminLayout({ children, restaurantName }: AdminLayoutProps) {
  return (
    <StitchLayout restaurantName={restaurantName}>
      {children}
    </StitchLayout>
  );
}
