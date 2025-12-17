import React from 'react';

export const GloovIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M88 12H50L12 50C12 70.9869 29.0131 88 50 88H88V50H50L88 12Z" fill="#1DCD9C"/>
    <path d="M50 50L88 12H50C29.0131 12 12 29.0131 12 50H50V50Z" fill="#2AE3B0"/>
    <circle cx="50" cy="50" r="16" fill="white"/>
  </svg>
);

export const GloovLogoFull: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 200 50" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g>
      <path fillRule="evenodd" clipRule="evenodd" d="M38 6H20L2 24C2 33.9411 10.0589 42 20 42H38V24H20L38 6Z" fill="#1DCD9C"/>
      <path d="M20 24L38 6H20C10.0589 6 2 14.0589 2 24H20V24Z" fill="#2AE3B0"/>
      <circle cx="20" cy="24" r="8" fill="white"/>
    </g>
    <text x="48" y="32" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="24" fill="#1DCD9C">Gloov</text>
    <text x="122" y="32" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="24" fill="#509e86">Up</text>
  </svg>
);