
import React from 'react';

const FlowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 3v12" />
    <path d="M18 9v12" />
    <path d="M6 15h12" />
    <path d="M6 21h12" />
    <path d="M12 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
  </svg>
);

export default FlowIcon;
