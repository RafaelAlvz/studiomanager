'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getConfiguracaoAction() {
    try {
        let config = await prisma.configuracao.findFirst();
        if (!config) {
            config = await prisma.configuracao.create({
                data: { nome_negocio: 'StudioManager' }
            });
        }
        return config;
    } catch (error) {
        console.error("Erro ao carregar configuração:", error);
        return { nome_negocio: 'StudioManager', logo_url: null };
    }
}

export async function saveConfiguracaoAction(data: { nome_negocio: string; logo_url?: string | null }) {
    try {
        const config = await prisma.configuracao.findFirst();

        if (config) {
            await prisma.configuracao.update({
                where: { id: config.id },
                data: {
                    nome_negocio: data.nome_negocio,
                    logo_url: data.logo_url
                }
            });
        } else {
            await prisma.configuracao.create({
                data: {
                    nome_negocio: data.nome_negocio,
                    logo_url: data.logo_url
                }
            });
        }

        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error: any) {
        console.error("Erro ao salvar configuração:", error);
        throw new Error(error.message || "Falha ao salvar as configurações.");
    }
}
