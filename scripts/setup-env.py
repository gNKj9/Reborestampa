#!/usr/bin/env python3
"""Gera os segredos do .env e define a palavra-passe do administrador.

Uso normal (interativo, não mostra o que escreves):

    python3 scripts/setup-env.py

Se preferires ver o que escreves (útil quando há gralhas):

    python3 scripts/setup-env.py --echo

Outro ficheiro (por exemplo para testar):

    python3 scripts/setup-env.py --file .env.teste

Os segredos gerados nunca são impressos no terminal.
"""

from __future__ import annotations

import argparse
import getpass
import re
import secrets
import sys
from pathlib import Path

MIN_PASSWORD_LENGTH = 12
MAX_ATTEMPTS = 3
DEFAULT_ADMIN_EMAIL = "admin@reborestampa.pt"

# Valores de exemplo do .env.example: devem ser substituídos na primeira execução.
PLACEHOLDER_DB_PASSWORDS = {"", "muda-esta-password", "troca-esta-password"}


def read_env(path: Path) -> str:
    if not path.exists():
        sys.exit(
            f"Ficheiro não encontrado: {path}\n"
            "Cria primeiro o .env a partir do modelo: cp .env.example .env"
        )
    return path.read_text(encoding="utf-8")


def get_value(text: str, key: str, fallback: str = "") -> str:
    match = re.search(rf"^{re.escape(key)}=(.*)$", text, re.MULTILINE)
    if not match:
        return fallback
    return match.group(1).strip().strip('"').strip("'")


def set_value(text: str, key: str, value: str) -> str:
    line = f"{key}={value}"
    pattern = re.compile(rf"^{re.escape(key)}=.*$", re.MULTILINE)
    if pattern.search(text):
        return pattern.sub(lambda _match: line, text)
    if text and not text.endswith("\n"):
        text += "\n"
    return text + line + "\n"


def password_problems(password: str) -> list[str]:
    problems = []
    if len(password) < MIN_PASSWORD_LENGTH:
        problems.append(f"menos de {MIN_PASSWORD_LENGTH} caracteres")
    if not any(char.islower() for char in password):
        problems.append("sem letras minúsculas")
    if not any(char.isupper() for char in password):
        problems.append("sem letras maiúsculas")
    if not any(char.isdigit() for char in password):
        problems.append("sem algarismos")
    return problems


def ask_password(echo: bool) -> str:
    read = input if echo else getpass.getpass

    print(
        f"A palavra-passe precisa de {MIN_PASSWORD_LENGTH}+ caracteres, "
        "com maiúscula, minúscula e algarismo."
    )

    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            password = read("Palavra-passe do administrador: ")
            confirmation = read("Repete a palavra-passe: ")
        except EOFError:
            sys.exit("\nEntrada interrompida. Nada foi alterado.")

        if password != confirmation:
            remaining = MAX_ATTEMPTS - attempt
            if remaining:
                print(f"Não coincidem. Tenta outra vez ({remaining} tentativa(s)).")
                continue
            sys.exit("Não coincidem. Nada foi alterado.")

        problems = password_problems(password)
        if problems:
            remaining = MAX_ATTEMPTS - attempt
            if remaining:
                print(f"Fraca ({', '.join(problems)}). Tenta outra vez.")
                continue
            sys.exit(
                "Palavra-passe fraca: " + ", ".join(problems) + ". Nada foi alterado."
            )

        return password

    raise SystemExit("Sem palavra-passe válida. Nada foi alterado.")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Preenche segredos no .env do projeto Reborestampa."
    )
    parser.add_argument(
        "--file",
        default=".env",
        help="caminho do ficheiro (omissão: .env)",
    )
    parser.add_argument(
        "--admin-password",
        help="palavra-passe do admin sem prompt (só para automação/testes)",
    )
    parser.add_argument(
        "--echo",
        action="store_true",
        help="mostra o que escreves ao pedir a palavra-passe",
    )
    args = parser.parse_args()

    path = Path(args.file)
    text = read_env(path)

    if args.admin_password is not None:
        password = args.admin_password
    else:
        password = ask_password(echo=args.echo)

    problems = password_problems(password)
    if problems:
        sys.exit("Palavra-passe fraca: " + ", ".join(problems) + ". Nada foi alterado.")

    db_user = get_value(text, "POSTGRES_USER", "reborestampa")
    db_name = get_value(text, "POSTGRES_DB", "reborestampa")

    # Só gera password de base de dados nova se ainda estiver o valor de exemplo:
    # assim, repetir o script para corrigir a password do admin não invalida
    # um volume de PostgreSQL já criado.
    current_db_password = get_value(text, "POSTGRES_PASSWORD")
    if current_db_password in PLACEHOLDER_DB_PASSWORDS:
        db_password = secrets.token_urlsafe(24)
        db_password_changed = True
    else:
        db_password = current_db_password
        db_password_changed = False

    text = set_value(text, "JWT_ACCESS_SECRET", secrets.token_hex(32))
    text = set_value(text, "JWT_REFRESH_SECRET", secrets.token_hex(32))
    text = set_value(text, "POSTGRES_PASSWORD", db_password)
    text = set_value(text, "SEED_ADMIN_PASSWORD", password)
    if not get_value(text, "SEED_ADMIN_EMAIL"):
        text = set_value(text, "SEED_ADMIN_EMAIL", DEFAULT_ADMIN_EMAIL)
    text = set_value(
        text,
        "DATABASE_URL",
        f"postgresql://{db_user}:{db_password}@localhost:5432/{db_name}?schema=public",
    )

    path.write_text(text, encoding="utf-8")
    path.chmod(0o600)

    print(f"OK: {path} atualizado.")
    print("Escritos: JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, SEED_ADMIN_PASSWORD,")
    print("          DATABASE_URL e SEED_ADMIN_EMAIL (se estava vazio).")

    if db_password_changed:
        print("POSTGRES_PASSWORD foi gerada agora.")
        print("Se a base de dados já existia com a password antiga, corre: docker compose down -v")
    else:
        print("POSTGRES_PASSWORD mantida (já não era o valor de exemplo).")


if __name__ == "__main__":
    main()
