import React from 'react';

export const LoadingSpinner: React.FC<{ size?: number; className?: string }> = ({ size = 40, className = '' }) => {
	const px = `${size}px`;
	return (
		<div role="status" className={`flex items-center justify-center ${className}`}>
			<svg
				width={size}
				height={size}
				viewBox="0 0 50 50"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				style={{ width: px, height: px }}
				aria-hidden="true"
			>
				<circle
					cx="25"
					cy="25"
					r="20"
					stroke="currentColor"
					strokeWidth="5"
					strokeOpacity="0.25"
				/>
				<path
					d="M45 25a20 20 0 00-7.5-15"
					stroke="currentColor"
					strokeWidth="5"
					strokeLinecap="round"
				>
					<animateTransform
						attributeName="transform"
						type="rotate"
						from="0 25 25"
						to="360 25 25"
						dur="0.9s"
						repeatCount="indefinite"
					/>
				</path>
			</svg>
			<span className="sr-only">Loading...</span>
		</div>
	);
};

export default LoadingSpinner;

