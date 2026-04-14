'use client'

import { useEffect, useMemo, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const DISMISS_KEY = 'prestabridge_install_prompt_dismissed'

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase()
    const iosDevice = /iphone|ipad|ipod/.test(ua)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    setIsIos(iosDevice)
    setIsStandalone(standalone)
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1')

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setDismissed(false)
    }

    const handleInstalled = () => {
      setDeferredPrompt(null)
      setDismissed(true)
      localStorage.setItem(DISMISS_KEY, '1')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const shouldShowIosHelp = useMemo(
    () => isIos && !isStandalone && !dismissed,
    [isIos, isStandalone, dismissed]
  )

  const shouldShowInstallButton = useMemo(
    () => Boolean(deferredPrompt) && !isStandalone && !dismissed,
    [deferredPrompt, isStandalone, dismissed]
  )

  if (!shouldShowIosHelp && !shouldShowInstallButton) {
    return null
  }

  const closePrompt = () => {
    setDismissed(true)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  const installApp = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    closePrompt()
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto w-[min(520px,calc(100%-1.5rem))] rounded-2xl border border-yellow-700/35 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur md:inset-x-0 md:bottom-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-yellow-700/50 bg-black text-xs font-bold tracking-wide text-yellow-500">
            PB
          </span>
          <div>
            <p className="text-sm font-semibold text-yellow-500">Installer PrestaBridge</p>
            {shouldShowInstallButton ? (
              <p className="mt-1 text-xs text-zinc-300">
                Ajoutez l&apos;app pour un lancement instantané, même sur réseau instable.
              </p>
            ) : (
              <p className="mt-1 text-xs text-zinc-300">
                Sur iPhone : touchez Partager puis &quot;Sur l&apos;écran d&apos;accueil&quot;.
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={closePrompt}
          className="rounded-md px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
        >
          Fermer
        </button>
      </div>

      {shouldShowInstallButton && (
        <button
          type="button"
          onClick={installApp}
          className="mt-3 w-full rounded-lg bg-yellow-600 px-3 py-2 text-sm font-semibold text-black transition hover:bg-yellow-500"
        >
          Installer l&apos;application
        </button>
      )}

      {shouldShowIosHelp && (
        <p className="mt-2 text-[11px] text-zinc-500">
          Astuce iOS: l&apos;option se trouve dans le menu de partage Safari.
        </p>
      )}
    </div>
  )
}
