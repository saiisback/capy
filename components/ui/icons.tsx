"use client"

import React from "react"

interface IconProps {
  size?: number
  className?: string
  style?: React.CSSProperties
}

// Heart Icon for love actions
export function HeartIcon({ size = 16, className = "", style = {} }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      style={{ imageRendering: 'pixelated', ...style }}
    >
      <path d="M8 14l-1.5-1.5C4.5 10.5 2 8.5 2 6c0-2 1.5-3.5 3.5-3.5 1 0 2 .5 2.5 1.5.5-1 1.5-1.5 2.5-1.5C12.5 2.5 14 4 14 6c0 2.5-2.5 4.5-4.5 6.5L8 14z"/>
    </svg>
  )
}

// Food Icon for feeding
export function FoodIcon({ size = 16, className = "", style = {} }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      style={{ imageRendering: 'pixelated', ...style }}
    >
      <path d="M2 4h12v1H2V4zm0 2h12v1H2V6zm0 2h12v1H2V8zm0 2h12v1H2v-1zm0 2h12v1H2v-1z"/>
      <circle cx="4" cy="3" r="1"/>
      <circle cx="8" cy="3" r="1"/>
      <circle cx="12" cy="3" r="1"/>
    </svg>
  )
}

// Game Controller Icon for arcade
export function GameControllerIcon({ size = 16, className = "", style = {} }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      style={{ imageRendering: 'pixelated', ...style }}
    >
      <rect x="2" y="6" width="12" height="4" rx="1"/>
      <circle cx="4" cy="8" r="1"/>
      <circle cx="12" cy="8" r="1"/>
      <rect x="1" y="4" width="2" height="1"/>
      <rect x="13" y="4" width="2" height="1"/>
      <rect x="1" y="11" width="2" height="1"/>
      <rect x="13" y="11" width="2" height="1"/>
    </svg>
  )
}

// Target Icon for target practice
export function TargetIcon({ size = 16, className = "", style = {} }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      style={{ imageRendering: 'pixelated', ...style }}
    >
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1"/>
      <circle cx="8" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1"/>
      <circle cx="8" cy="8" r="2" fill="currentColor"/>
    </svg>
  )
}

// Running Icon for chase game
export function RunningIcon({ size = 16, className = "", style = {} }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      style={{ imageRendering: 'pixelated', ...style }}
    >
      <rect x="2" y="10" width="2" height="4"/>
      <rect x="6" y="8" width="2" height="6"/>
      <rect x="10" y="6" width="2" height="8"/>
      <rect x="12" y="4" width="2" height="2"/>
      <rect x="8" y="2" width="2" height="2"/>
      <rect x="4" y="4" width="2" height="2"/>
    </svg>
  )
}

// Puzzle Icon for puzzle time
export function PuzzleIcon({ size = 16, className = "", style = {} }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      style={{ imageRendering: 'pixelated', ...style }}
    >
      <path d="M2 2h4v2H4v2H2V2zm8 0h4v4h-2V4h-2V2zm0 4h2v2h2v4h-4V6zM2 8h4v6H2V8zm6 0h6v4h-2v-2H8v2H6V8z"/>
    </svg>
  )
}

// Pet Icon for pet status
export function PetIcon({ size = 16, className = "", style = {} }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      style={{ imageRendering: 'pixelated', ...style }}
    >
      <circle cx="8" cy="6" r="3"/>
      <path d="M5 10c0-2 1-3 3-3s3 1 3 3v2H5v-2z"/>
      <circle cx="6" cy="5" r="1"/>
      <circle cx="10" cy="5" r="1"/>
      <path d="M7 7h2"/>
    </svg>
  )
}

// Clock Icon for timestamps
export function ClockIcon({ size = 16, className = "", style = {} }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      style={{ imageRendering: 'pixelated', ...style }}
    >
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1"/>
      <path d="M8 4v4l3 2"/>
    </svg>
  )
}

// Star Icon for happiness
export function StarIcon({ size = 16, className = "", style = {} }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      style={{ imageRendering: 'pixelated', ...style }}
    >
      <path d="M8 1l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4l2-4z"/>
    </svg>
  )
}

// Wallet Icon for connection
export function WalletIcon({ size = 16, className = "", style = {} }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      style={{ imageRendering: 'pixelated', ...style }}
    >
      <rect x="2" y="4" width="12" height="8" rx="1"/>
      <rect x="4" y="6" width="8" height="4" fill="none" stroke="currentColor" strokeWidth="1"/>
      <circle cx="10" cy="8" r="1"/>
    </svg>
  )
}

// Mail Icon for invitations
export function MailIcon({ size = 16, className = "", style = {} }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      style={{ imageRendering: 'pixelated', ...style }}
    >
      <rect x="2" y="4" width="12" height="8" rx="1"/>
      <path d="M2 6l6 4 6-4"/>
    </svg>
  )
}

// Shopping Cart Icon for marketplace
export function ShoppingCartIcon({ size = 16, className = "", style = {} }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      style={{ imageRendering: 'pixelated', ...style }}
    >
      <path d="M2 2h1l1.5 6h8l1.5-6H14v1h-1.5l-1 4H4.5l-1-4H2V2zm2.5 5h7l.5-2H4l.5 2z"/>
      <circle cx="5" cy="13" r="1"/>
      <circle cx="11" cy="13" r="1"/>
    </svg>
  )
}

// Loading Dots Animation
export function LoadingDots({ className = "" }: { className?: string }) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      <div className="w-2 h-2 bg-current animate-pulse"></div>
      <div className="w-2 h-2 bg-current animate-pulse" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-2 h-2 bg-current animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
  )
}
