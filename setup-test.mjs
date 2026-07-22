import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wznnriabescrszhyxisr.supabase.co'
const supabaseKey = 'sb_publishable_fCfDHxole_SX9cvAlRsW7g_54G5fP20'
const password = '123456'

async function run() {
  console.log('=== CONFIGURANDO DATOS DE PRUEBA ===\n')

  // 1. Login como empresa y crear empresa + perfil dueño
  console.log('1. Configurando empresa...')
  const supaEmpresa = createClient(supabaseUrl, supabaseKey)
  const { data: { user: userEmpresa } } = await supaEmpresa.auth.signInWithPassword({ email: 'empresa@test.com', password })

  const { data: existingCompany } = await supaEmpresa.from('companies').select('id').eq('owner_id', userEmpresa.id).single()
  let companyId

  if (existingCompany) {
    companyId = existingCompany.id
    console.log('   Empresa ya existe')
  } else {
    const { data: company } = await supaEmpresa.from('companies').insert({ owner_id: userEmpresa.id, name: 'Constructora Julia', default_rate: 10.00 }).select().single()
    companyId = company.id
    console.log('   Empresa creada:', companyId)
  }

  const { data: profileEmpresa } = await supaEmpresa.from('profiles').select('id').eq('id', userEmpresa.id).single()
  if (!profileEmpresa) {
    await supaEmpresa.from('profiles').insert({ id: userEmpresa.id, role: 'company_owner', hourly_rate: 15.00, company_id: companyId, full_name: 'Dueño Empresa' })
    console.log('   Perfil dueño creado')
  }

  // 2. Login como empleado1 y crear su perfil
  console.log('\n2. Configurando empleado 1...')
  const supaEmp1 = createClient(supabaseUrl, supabaseKey)
  const { data: { user: userEmp1 } } = await supaEmp1.auth.signInWithPassword({ email: 'empleado1@test.com', password })

  const { data: profileEmp1 } = await supaEmp1.from('profiles').select('id').eq('id', userEmp1.id).single()
  if (!profileEmp1) {
    await supaEmp1.from('profiles').insert({ id: userEmp1.id, role: 'employee', hourly_rate: 10.00, company_id: companyId, full_name: 'Carlos García' })
    console.log('   Perfil Carlos creado')
  } else {
    console.log('   Perfil Carlos ya existe')
  }

  // 3. Login como empleado2 y crear su perfil
  console.log('\n3. Configurando empleado 2...')
  const supaEmp2 = createClient(supabaseUrl, supabaseKey)
  const { data: { user: userEmp2 } } = await supaEmp2.auth.signInWithPassword({ email: 'empleado2@test.com', password })

  const { data: profileEmp2 } = await supaEmp2.from('profiles').select('id').eq('id', userEmp2.id).single()
  if (!profileEmp2) {
    await supaEmp2.from('profiles').insert({ id: userEmp2.id, role: 'employee', hourly_rate: 10.00, company_id: companyId, full_name: 'María López' })
    console.log('   Perfil María creado')
  } else {
    console.log('   Perfil María ya existe')
  }

  // 4. Crear turnos como cada empleado
  console.log('\n4. Creando turnos...')

  const today = new Date()
  const dateStr = (d) => { const dt = new Date(today); dt.setDate(dt.getDate() - d); return dt.toISOString().split('T')[0] }

  const { data: existingShifts } = await supaEmp1.from('work_shifts').select('id').eq('user_id', userEmp1.id).limit(1)
  if (!existingShifts || existingShifts.length === 0) {
    await supaEmp1.from('work_shifts').insert([
      { user_id: userEmp1.id, work_date: dateStr(2), start_time: '08:00', end_time: '17:00', break_minutes: 60, notes: 'Turno normal', total_hours: 8.00 },
      { user_id: userEmp1.id, work_date: dateStr(1), start_time: '08:00', end_time: '16:30', break_minutes: 45, notes: 'Medio día', total_hours: 7.75 },
      { user_id: userEmp1.id, work_date: dateStr(0), start_time: '07:30', end_time: '17:30', break_minutes: 60, notes: 'Jornada completa', total_hours: 9.00 },
    ])
    console.log('   3 turnos de Carlos creados')
  } else {
    console.log('   Turnos de Carlos ya existen')
  }

  const { data: existingShifts2 } = await supaEmp2.from('work_shifts').select('id').eq('user_id', userEmp2.id).limit(1)
  if (!existingShifts2 || existingShifts2.length === 0) {
    await supaEmp2.from('work_shifts').insert([
      { user_id: userEmp2.id, work_date: dateStr(2), start_time: '09:00', end_time: '18:00', break_minutes: 60, notes: 'Turno normal', total_hours: 8.00 },
      { user_id: userEmp2.id, work_date: dateStr(1), start_time: '09:00', end_time: '17:00', break_minutes: 45, notes: 'Turno corto', total_hours: 7.25 },
      { user_id: userEmp2.id, work_date: dateStr(0), start_time: '08:00', end_time: '17:00', break_minutes: 60, notes: 'Normal', total_hours: 8.00 },
    ])
    console.log('   3 turnos de María creados')
  } else {
    console.log('   Turnos de María ya existen')
  }

  console.log('\n✅ ¡LISTO! Ejecuta npm run dev y entra con:')
  console.log('\n   empresa@test.com   / 123456  (Dueño - ve dashboard empresa)')
  console.log('   empleado1@test.com / 123456  (Carlos - registra horas)')
  console.log('   empleado2@test.com / 123456  (María - registra horas)')
}

run()
