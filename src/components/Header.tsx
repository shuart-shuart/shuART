import React from 'react';
import { ViewMode, NavItemConfig } from '../types';

interface HeaderProps {
  currentView: ViewMode;
  onNavigateView: (view: ViewMode) => void;
  onRandomWander: () => void;
  showWander: boolean;
  navOrder?: NavItemConfig[];
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigateView,
  onRandomWander,
  showWander,
  navOrder,
}) => {
  // If navOrder is supplied, use it; otherwise fallback to streamlined list (Index, About, Wander)
  const items: NavItemConfig[] = navOrder && navOrder.length > 0
    ? navOrder.filter((n) => n.view === 'index' || n.view === 'about' || n.view === 'wander')
    : [
        { id: 'index', label: 'Index', view: 'index', visible: true },
        { id: 'about', label: 'About', view: 'about', visible: true },
        { id: 'wander', label: 'Wander', view: 'wander', visible: showWander },
      ];

  return (
    <header className="border-b border-black/10 bg-white sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 sm:py-5 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2.5">
        {/* Left: Artist Name (no subtitle) */}
        <div>
          <button
            onClick={() => onNavigateView('index')}
            className="text-left focus:outline-none"
          >
            <span className="font-editorial text-2xl text-black tracking-tight">
              Hong Shu-ying <span className="font-normal text-black/80 whitespace-nowrap">方舒颖</span>
            </span>
          </button>
        </div>

        {/* Navigation: Quiet text links rendered in custom order, wraps cleanly to second row on narrow screens */}
        <nav className="flex items-baseline flex-wrap gap-x-6 sm:gap-x-7 gap-y-1.5 text-sm font-sans tracking-tight">
          {items.map((item) => {
            // For wander, check both item.visible and showWander
            if (item.id === 'wander') {
              if (!showWander || !item.visible) return null;
              return (
                <button
                  key={item.id}
                  onClick={onRandomWander}
                  className={`transition-colors py-0.5 relative focus:outline-none ${
                    currentView === 'wander'
                      ? 'text-black font-medium border-b border-black'
                      : 'text-black/60 hover:text-black'
                  }`}
                  title="Jump to a random published entry"
                >
                  {item.label}
                </button>
              );
            }

            // Normal nav items
            if (!item.visible) return null;

            const isActive = currentView === item.view;
            const isNoWrap = item.label.includes('/') || item.id === 'ss';

            return (
              <button
                key={item.id}
                onClick={() => onNavigateView(item.view)}
                className={`transition-colors py-0.5 relative focus:outline-none ${
                  isNoWrap ? 'whitespace-nowrap' : ''
                } ${
                  isActive
                    ? 'text-black font-medium border-b border-black'
                    : 'text-black/60 hover:text-black'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
