import React from "react";

type Planet = {
  planet: string;
  longitude: number;
  house: number;
};

type Props = {
  planets: Planet[];
};

const rashiNames = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
];

export const KundaliChart = ({ planets }: Props) => {
  return (
    <svg width={400} height={400} viewBox="0 0 400 400">
      <circle cx="200" cy="200" r="180" stroke="black" fill="none" />

      {/* 12 house lines */}
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x = 200 + 180 * Math.cos(angle);
        const y = 200 + 180 * Math.sin(angle);
        return <line key={i} x1="200" y1="200" x2={x} y2={y} stroke="gray" />;
      })}

      {/* Planets */}
      {planets.map((p, i) => {
        const angle = ((p.house - 1) * 30 + 15 - 90) * (Math.PI / 180);
        const x = 200 + 120 * Math.cos(angle);
        const y = 200 + 120 * Math.sin(angle);
        return (
          <text key={i} x={x} y={y} fontSize="12" textAnchor="middle">
            {p.planet}
          </text>
        );
      })}
    </svg>
  );
};