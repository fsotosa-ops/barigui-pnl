import { NextResponse, type NextRequest } from 'next/server' 
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) { 
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Si hay parámetro 'next', lo usamos, si no al inicio
  const next = searchParams.get('next') ?? '/'

  if (code) {
    // 1. Preparamos la respuesta final que redirige al usuario
    const response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Seteamos cookies en la request temporalmente (para que la sesión sea válida ahora mismo)
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            )
            // Y LO MÁS IMPORTANTE: Las escribimos en la respuesta que va al navegador
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // 2. Intercambiamos el código de Google por la sesión de Supabase
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Devolvemos la respuesta con las cookies ya inyectadas
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}