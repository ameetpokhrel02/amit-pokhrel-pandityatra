import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface AdminTOTPInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
}

export const AdminTOTPInput: React.FC<AdminTOTPInputProps> = ({ 
  value, 
  onChange, 
  onComplete,
  disabled 
}) => {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync internal array with external value string
  useEffect(() => {
    if (value === "") {
      setOtp(new Array(6).fill(""));
    }
  }, [value]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    
    const combinedOtp = newOtp.join("");
    onChange(combinedOtp);

    // Focus next input
    if (element.value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    if (newOtp.every(val => val !== "") && onComplete) {
      onComplete(combinedOtp);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(data)) return;

    const newOtp = [...otp];
    data.split("").forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    onChange(newOtp.join(""));
    
    // Focus last or next empty
    const lastIndex = data.length < 6 ? data.length : 5;
    inputRefs.current[lastIndex]?.focus();

    if (data.length === 6 && onComplete) {
      onComplete(data);
    }
  };

  return (
    <div className="flex gap-2 sm:gap-4 justify-center">
      {otp.map((data, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          autoFocus={index === 0}
          maxLength={1}
          ref={(el) => { inputRefs.current[index] = el; }}
          value={data}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-10 h-14 sm:w-12 sm:h-16 text-center text-2xl font-black bg-white/50 backdrop-blur-sm border-2 border-orange-100 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-200 transform focus:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        />
      ))}
    </div>
  );
};
