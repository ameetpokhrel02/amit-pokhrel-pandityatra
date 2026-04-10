import React from "react";

type Planet = {
    planet: string;
    longitude: number;
    house: number;
    rashi?: string;
};

type Props = {
    planets: Planet[];
    lagna?: number; // 1-12
};

const shortPlanetNames: Record<string, string> = {
    "Sun": "Su",
    "Moon": "Mo",
    "Mars": "Ma",
    "Mercury": "Me",
    "Jupiter": "Ju",
    "Venus": "Ve",
    "Saturn": "Sa",
    "Rahu": "Ra",
    "Ketu": "Ke",
    "Uranus": "Ur",
    "Neptune": "Ne",
    "Pluto": "Pl",
    "Ascendant": "As",
    "Lagna": "As"
};

/**
 * North Indian Style Kundali Chart (Diamond/Square)
 */
export const KundaliChart: React.FC<Props> = ({ planets, lagna = 1 }) => {
    // Group planets by house
    const planetsInHouses: Record<number, string[]> = {};
    for (let i = 1; i <= 12; i++) planetsInHouses[i] = [];

    planets.forEach(p => {
        const name = shortPlanetNames[p.planet] || p.planet.substring(0, 2);
        if (p.house >= 1 && p.house <= 12) {
            planetsInHouses[p.house].push(name);
        }
    });

    const getRashiForHouse = (houseNum: number) => {
        let r = (lagna + houseNum - 1) % 12;
        return r === 0 ? 12 : r;
    };

    const housePositions: Record<number, { x: number, y: number, rashiX: number, rashiY: number, labelX: number, labelY: number }> = {
        1: { x: 200, y: 130, rashiX: 200, rashiY: 75, labelX: 200, labelY: 45 },  // Physique
        2: { x: 100, y: 60, rashiX: 130, rashiY: 90, labelX: 80, labelY: 35 },   // Wealth
        3: { x: 55, y: 110, rashiX: 85, rashiY: 140, labelX: 35, labelY: 75 },   // Siblings
        4: { x: 135, y: 200, rashiX: 80, rashiY: 200, labelX: 55, labelY: 170 }, // Mother/Home
        5: { x: 55, y: 300, rashiX: 85, rashiY: 270, labelX: 35, labelY: 325 },  // Children
        6: { x: 100, y: 350, rashiX: 130, rashiY: 320, labelX: 80, labelY: 375 }, // Enemies
        7: { x: 200, y: 275, rashiX: 200, rashiY: 330, labelX: 200, labelY: 365 }, // Partner
        8: { x: 305, y: 350, rashiX: 270, rashiY: 320, labelX: 325, labelY: 375 }, // Longevity
        9: { x: 350, y: 300, rashiX: 320, rashiY: 270, labelX: 370, labelY: 325 }, // Luck/Religion
        10: { x: 265, y: 200, rashiX: 325, rashiY: 200, labelX: 345, labelY: 170 }, // Career
        11: { x: 350, y: 110, rashiX: 320, rashiY: 140, labelX: 370, labelY: 75 }, // Gains
        12: { x: 305, y: 60, rashiX: 270, rashiY: 90, labelX: 325, labelY: 35 },  // Loss
    };

    const houseLabels: Record<number, string> = {
        1: "Body", 2: "Money", 3: "Siblings", 4: "Home",
        5: "Study", 6: "Enemies", 7: "Partner", 8: "Age",
        9: "Luck", 10: "Work", 11: "Benefits", 12: "Loss"
    };

    const h = (num: number) => housePositions[num];

    return (
        <div className="flex justify-center p-6 bg-gradient-to-br from-orange-50 to-white rounded-2xl shadow-xl border border-orange-200/50">
            <svg width="100%" viewBox="0 0 400 400" className="max-w-[450px] drop-shadow-xl overflow-visible">
                {/* Background Decoration */}
                <rect x="0" y="0" width="400" height="400" fill="white" rx="12" />
                
                {/* Elegant Borders */}
                <rect x="5" y="5" width="390" height="390" fill="none" stroke="#FFD700" strokeWidth="0.5" rx="12" />
                
                {/* Traditional Saffron Chart Lines */}
                <g stroke="#EA580C" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="10" y="10" width="380" height="380" />
                    <line x1="10" y1="10" x2="390" y2="390" />
                    <line x1="10" y1="390" x2="390" y2="10" />
                    <path d="M 200 10 L 10 200 L 200 390 L 390 200 Z" />
                </g>

                {/* House Significance Labels (Very subtle) */}
                <g className="fill-orange-400 italic" fontSize="8" style={{ pointerEvents: 'none' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                        <text 
                            key={`label-${num}`} 
                            x={h(num).labelX} 
                            y={h(num).labelY} 
                            textAnchor="middle" 
                        >
                            {houseLabels[num]}
                        </text>
                    ))}
                </g>

                {/* Rashi Numbers (Standard numbering in red/brown) */}
                <g className="font-bold fill-red-800" fontSize="15">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                        <text 
                            key={`rashi-${num}`} 
                            x={h(num).rashiX} 
                            y={h(num).rashiY} 
                            textAnchor="middle" 
                            alignmentBaseline="middle"
                        >
                            {getRashiForHouse(num)}
                        </text>
                    ))}
                </g>

                {/* Planet Placement */}
                <g className="font-bold fill-gray-900" fontSize="13">
                    {Object.entries(planetsInHouses).map(([house, pList]) => {
                        const houseNum = parseInt(house);
                        if (pList.length === 0) return null;

                        // Center placement logic
                        return (
                            <text
                                key={`planets-h${houseNum}`}
                                x={h(houseNum).x}
                                y={h(houseNum).y}
                                textAnchor="middle"
                            >
                                {pList.map((p, idx) => (
                                    <tspan 
                                        key={idx} 
                                        x={h(houseNum).x} 
                                        dy={idx === 0 ? 0 : 16}
                                        className="tracking-tighter"
                                    >
                                        {p}
                                    </tspan>
                                ))}
                            </text>
                        );
                    })}
                </g>

                {/* Aesthetic Corner Accents */}
                <g fill="#EA580C" stroke="none" opacity="0.6">
                    <circle cx="10" cy="10" r="3" />
                    <circle cx="390" cy="10" r="3" />
                    <circle cx="10" cy="390" r="3" />
                    <circle cx="390" cy="390" r="3" />
                </g>
            </svg>
        </div>
    );
};