"use client"

import { useWallet } from "@/contexts/wallet-context"
import { WalletIcon, MailIcon, PetIcon, HeartIcon } from "./ui/icons"
import { shortenAddress } from "@/lib/wallet"

export default function Navbar() {
  const { connected, account, disconnect } = useWallet()

  return (
    <nav className="bg-card border-b border-border px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <HeartIcon size={16} className="text-primary-foreground" />
          </div>
          <span className="font-pixel text-lg text-foreground">CAPY</span>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          <a 
            href="/invitation" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MailIcon size={16} />
            Invitation
          </a>
          <a 
            href="/dashboard" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <PetIcon size={16} />
            Dashboard
          </a>
        </div>

        {/* Wallet Info */}
        <div className="flex items-center gap-3">
          {connected && account ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg">
                <WalletIcon size={14} className="text-primary" />
                <span className="text-sm font-mono text-primary">
                  {shortenAddress(account.address)}
                </span>
              </div>
              <button
                onClick={disconnect}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <a 
              href="/" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <WalletIcon size={16} />
              Connect Wallet
            </a>
          )}
        </div>
      </div>
    </nav>
  )
}
