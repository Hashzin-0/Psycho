#!/usr/bin/env python3
"""Seed the recipe encyclopedia with gastronomy knowledge entries."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.rag.search import init_db, seed_gastronomy


def main():
    print("🍳 Inicializando banco de dados...")
    init_db()
    print("📚 Populando enciclopédia gastronômica...")
    seed_gastronomy()
    print("✅ Base gastronômica carregada com sucesso!")
    print(f"   Localização: backend/psycho.db")


if __name__ == "__main__":
    main()
