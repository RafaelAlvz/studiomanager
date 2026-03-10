export function formatCurrencyInput(value: string | number): string {
    if (value === undefined || value === null) return "";

    // Se for número, converte pra string e tira decimais para simular digitação
    const stringValue = typeof value === 'number' ? value.toFixed(2).replace('.', '') : value;

    // Remove tudo que não for número
    const numbers = String(stringValue).replace(/\D/g, "");
    if (!numbers) return "";

    // Converte para decimal
    const amount = Number(numbers) / 100;

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(amount);
}

export function parseCurrencyInput(value: string | number): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;

    // Remove tudo que não for número
    const numbers = value.replace(/\D/g, "");
    return Number(numbers) / 100;
}
