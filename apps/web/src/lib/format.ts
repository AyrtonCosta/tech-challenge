const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const DAY = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});

const TYPE_LABEL: Record<string, string> = {
  TRANSFER: 'Transferência',
  DEPOSIT: 'Depósito',
  WITHDRAWAL: 'Saque',
};

export function formatTypeName(name: string): string {
  return TYPE_LABEL[name] ?? name;
}

export function formatBRL(value: number): string {
  return BRL.format(value);
}

export function formatDate(iso: string): string {
  return DAY.format(new Date(iso));
}

export function dateInputToIsoStart(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function dateInputToIsoEnd(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
