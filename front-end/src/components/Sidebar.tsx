import React from 'react';
import { Trophy, BookOpen, ChevronDown, Search, Moon, HelpCircle } from 'lucide-react';

interface NavItemProps {
  icon: React.ReactNode;
  color: string;
  label: string;
}

const Sidebar: React.FC = () => {
  const NavItem: React.FC<NavItemProps> = ({ icon, color, label }) => (
    <div className={`flex items-center gap-3 p-3 hover:bg-gray-700 rounded-md transition-colors duration-200 cursor-pointer ${label === 'Play' ? 'bg-gray-700' : ''}`}>
      <div className={`text-${color}-500`}>{icon}</div>
      <span className="text-white font-medium">{label}</span>
    </div>
  );

  return (
    <div className="w-56 bg-gray-800 flex flex-col p-4 shadow-xl">
      <div className="p-2">
        <div className="flex items-center gap-2 mb-8">
          <div className="text-xl font-bold text-white flex items-center">
            <span className="text-green-500 mr-1 text-2xl">♟</span>
            <span className="text-xl">Chess.io</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <NavItem icon={<span className="text-xl">♟</span>} color="amber" label="Play" />
          <NavItem icon={<Trophy size={18} />} color="orange" label="Puzzles" />
          <NavItem icon={<BookOpen size={18} />} color="blue" label="Learn" />
          <NavItem icon={<span className="text-xl">👁</span>} color="gray" label="Watch" />
          <NavItem icon={<span className="text-xl">📰</span>} color="red" label="News" />
          <NavItem icon={<span className="text-xl">👥</span>} color="purple" label="Social" />
          <div className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-md transition-colors duration-200 cursor-pointer">
            <ChevronDown className="text-gray-400" size={16} />
            <span className="text-white font-medium">More</span>
          </div>
        </div>
        
        <div className="mt-6 relative">
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full bg-gray-700 text-white p-2 rounded-md pl-8 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
        </div>
        
        <div className="mt-8 text-gray-400 space-y-2">
          <div className="flex items-center gap-2 p-2 hover:text-white hover:bg-gray-700 rounded-md transition-colors duration-200 cursor-pointer">
            <span>🌐</span> English
          </div>
          <div className="flex items-center gap-2 p-2 hover:text-white hover:bg-gray-700 rounded-md transition-colors duration-200 cursor-pointer">
            <Moon size={16} /> Dark UI
          </div>
          <div className="flex items-center gap-2 p-2 hover:text-white hover:bg-gray-700 rounded-md transition-colors duration-200 cursor-pointer">
            <HelpCircle size={16} /> Support
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;