import React from 'react';

interface MiniOrbitProps {
    className?: string;
    size?: number;
    color?: string;
}

const MiniOrbit: React.FC<MiniOrbitProps> = ({ className = "", size = 40, color = "white" }) => {
    return (
        <div
            className={`relative flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
        >
            {/* Outer Ring */}
            <div className="absolute inset-0 border border-current rounded-full animate-[spin_4s_linear_infinite] opacity-30" />
            {/* Inner Ring */}
            <div className="absolute inset-1.5 border border-current rounded-full animate-[spin_3s_linear_infinite_reverse] opacity-20" />

            {/* Orbiting Particle 1 */}
            <div className="absolute inset-0 animate-[spin_2s_linear_infinite]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-yellow-300 rounded-full shadow-[0_0_8px_#fcd34d]" />
            </div>

            {/* Orbiting Particle 2 */}
            <div className="absolute inset-1.5 animate-[spin_3.5s_linear_infinite_reverse]">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-200 rounded-full shadow-[0_0_6px_#ffedd5]" />
            </div>

            {/* Center Dot */}
            <div className="w-1.5 h-1.5 bg-current rounded-full shadow-[0_0_10px_currentColor] opacity-50" />
        </div>
    );
};

export default MiniOrbit;
