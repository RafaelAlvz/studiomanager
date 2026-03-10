import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log(`Start seeding ...`)

  // Cleanup Database
  await prisma.transacao.deleteMany()
  await prisma.agendamento.deleteMany()
  await prisma.cliente.deleteMany()
  await prisma.servico.deleteMany()
  await prisma.profissional.deleteMany()
  // Não deletaremos os usuários sistematicamente para não perder o admin, usaremos upsert.

  // 0. Seed de Usuário Admin (NextAuth)
  const hashedSenha = await bcrypt.hash('123456', 10)
  const adminUser = await prisma.usuario.upsert({
    where: { email: 'rafael@studiomanager.com' },
    update: {
      senha: hashedSenha,
      role: 'ADMIN' // Garante que é admin
    },
    create: {
      nome: 'Rafael Admin',
      email: 'rafael@studiomanager.com',
      senha: hashedSenha,
      role: 'ADMIN',
    }
  })
  console.log(`Admin user ensured: ${adminUser.email}`)

  // 1. Criar Profissional
  const profissional = await prisma.profissional.create({
    data: {
      nome: 'Rafael',
      especialidade: 'Barbeiro Chefe',
      diasTrabalho: '1,2,3,4,5,6', // Segunda a Sábado
      inicioExpediente: '09:00',
      fimExpediente: '19:00',
    },
  })
  console.log(`Created profissional com id: ${profissional.id}`)

  // 2. Criar Serviços
  const servicoCorte = await prisma.servico.create({
    data: {
      nome_servico: 'Corte de Cabelo',
      duracao: 45,
      tempoPreparacao: 15,
      preco: 45.0,
    },
  })

  const servicoBarba = await prisma.servico.create({
    data: {
      nome_servico: 'Barba Terapia',
      duracao: 30,
      tempoPreparacao: 5,
      preco: 35.0,
    },
  })
  console.log(`Created servicos com ids: ${servicoCorte.id}, ${servicoBarba.id}`)

  // 3. Criar Clientes
  const cliente1 = await prisma.cliente.create({
    data: {
      nome: 'Lucas Oliveira',
      telefone_whatsapp: '11999999999',
    },
  })

  const cliente2 = await prisma.cliente.create({
    data: {
      nome: 'Roberto Alves',
      telefone_whatsapp: '11888888888',
    },
  })
  console.log(`Created clientes com ids: ${cliente1.id}, ${cliente2.id}`)

  // 4. Criar Agendamentos
  // Agendamento Pendente (Futuro hoje)
  const dataHoje1 = new Date()
  dataHoje1.setHours(16, 0, 0, 0)

  const dataHoje1Fim = new Date(dataHoje1)
  dataHoje1Fim.setMinutes(dataHoje1.getMinutes() + 45)

  await prisma.agendamento.create({
    data: {
      cliente_id: cliente1.id,
      profissional_id: profissional.id,
      servico_id: servicoCorte.id,
      data_hora_inicio: dataHoje1,
      data_hora_fim: dataHoje1Fim,
      status_agendamento: 'Pendente',
      status_pagamento: 'Pendente',
      valor_total: servicoCorte.preco,
    },
  })

  // Agendamento Confirmado/Sinal Pago (Mais tarde)
  const dataHoje2 = new Date()
  dataHoje2.setHours(17, 30, 0, 0)
  const dataHoje2Fim = new Date(dataHoje2)
  dataHoje2Fim.setMinutes(dataHoje2.getMinutes() + 30)

  await prisma.agendamento.create({
    data: {
      cliente_id: cliente2.id,
      profissional_id: profissional.id,
      servico_id: servicoBarba.id,
      data_hora_inicio: dataHoje2,
      data_hora_fim: dataHoje2Fim,
      status_agendamento: 'Confirmado',
      status_pagamento: 'Sinal_Pago',
      valor_total: servicoBarba.preco,
    },
  })

  // Agendamento Concluído (Mais cedo)
  const dataHoje3 = new Date()
  dataHoje3.setHours(10, 0, 0, 0)
  const dataHoje3Fim = new Date(dataHoje3)
  dataHoje3Fim.setMinutes(dataHoje3.getMinutes() + 75)

  await prisma.agendamento.create({
    data: {
      cliente_id: cliente2.id, // Roberto fez dois serviços hoje no teste
      profissional_id: profissional.id,
      servico_id: servicoCorte.id,
      data_hora_inicio: dataHoje3,
      data_hora_fim: dataHoje3Fim,
      status_agendamento: 'Concluído',
      status_pagamento: 'Pago_Total',
      valor_total: servicoCorte.preco + servicoBarba.preco,
    },
  })
  console.log(`Created 3 agendamentos for test.`)
  console.log(`Seeding finished.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
