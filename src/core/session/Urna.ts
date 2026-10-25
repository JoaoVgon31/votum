import type { Cedula } from './Cedula.ts';
import { CedulaDuplicadaError } from './errors/SessaoError.ts';

export class Urna {
    private readonly _cedulas = new Map<string, Cedula>();

    public registrar(cedula: Cedula): void {
        if (this._cedulas.has(cedula.id)) {
            throw new CedulaDuplicadaError(
                `Tentativa de registrar voto rejeitada: a cédula com o id "${cedula.id}" já foi registrada nesta sessão.`,
            );
        }
        this._cedulas.set(cedula.id, { ...cedula });
    }

    public get total(): number {
        return this._cedulas.size;
    }

    public listar(): readonly Cedula[] {
        return Array.from(this._cedulas.values());
    }

    public esvaziar(): void {
        this._cedulas.clear();
    }
}
