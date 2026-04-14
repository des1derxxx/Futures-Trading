import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

let echo: Echo<'reverb'> | null = null

export function getEcho(): Echo<'reverb'> {
  const token = localStorage.getItem('token')

  if (!echo) {
    ;(window as Window & typeof globalThis & { Pusher: typeof Pusher }).Pusher = Pusher

    echo = new Echo({
      broadcaster: 'reverb',
      key: process.env.NEXT_PUBLIC_REVERB_APP_KEY!,
      wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? 'localhost',
      wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
      wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
      forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'http') === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      },
    })
  } else {
    // Обновляем токен авторизации при каждом вызове — на случай если он обновился после создания Echo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(echo.connector as any).pusher.config.auth = {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    }
  }

  return echo
}

export function resetEcho(): void {
  if (echo) {
    echo.disconnect()
    echo = null
  }
}
