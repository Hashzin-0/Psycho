#!/usr/bin/env python3
"""Script para popular a base de conhecimento e banco de dados do Psycho."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from rag.search import init_db, seed_knowledge


def main():
    print("🧠 Inicializando banco de dados do Psycho...")
    init_db()

    print("📚 Populando base de conhecimento psicológico...")
    seed_knowledge()

    print("✅ Base de conhecimento populada com sucesso!")
    print(f"   Arquivo: {os.path.join(os.path.dirname(__file__), 'psycho.db')}")


if __name__ == "__main__":
    main()
