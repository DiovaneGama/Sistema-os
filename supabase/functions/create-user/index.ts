import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Admin client (service role) — bypassa RLS em todas as operações
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Lê e valida o body
    const body = await req.json()
    const { full_name, username, password, role, daily_os_goal, commission_rate } = body

    if (!full_name || !username || !password || !role) {
      return new Response(JSON.stringify({ ok: false, error: 'Campos obrigatórios: full_name, username, password, role' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const usernameClean = username.trim().toLowerCase()
    const email = `${usernameClean}@sistema.local`

    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createErr || !newUser.user) {
      return new Response(JSON.stringify({ ok: false, error: createErr?.message ?? 'Erro ao criar usuário no Auth' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Insere o perfil vinculado ao novo usuário
    const { data: profile, error: insertErr } = await adminClient
      .from('profiles')
      .insert({
        id: newUser.user.id,
        full_name: full_name.trim(),
        username: usernameClean,
        role,
        daily_os_goal: daily_os_goal ?? 10,
        commission_rate: commission_rate ?? 0.01,
        active: true,
      })
      .select()
      .single()

    if (insertErr) {
      // Reverte a criação do usuário no Auth se o perfil falhou
      await adminClient.auth.admin.deleteUser(newUser.user.id)
      return new Response(JSON.stringify({ ok: false, error: insertErr.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true, profile }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err?.message ?? 'Erro interno' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
