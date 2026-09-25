import { Outlet } from 'react-router-dom';
import { previewStudent } from './previewStudent';
import { Header } from '../../../widgets/header';

export function PreviewLayout() {
  return <div className="min-h-screen flex flex-col md:flex-row bg-white">
    <Header previewUser={previewStudent} />
    <main className="flex-1 min-w-0"><Outlet /></main>
  </div>;
}
