import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

// Em desenvolvimento, o Next.js pode reiniciar módulos várias vezes. 
// Para evitar o esgotamento das conexões do Prisma, instanciamos com um objeto global.
const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
