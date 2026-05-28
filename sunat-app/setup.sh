#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}══════════════════════════════════════${NC}"
echo -e "${CYAN}  SUNAT App — Setup & Run${NC}"
echo -e "${CYAN}══════════════════════════════════════${NC}"

# ── [1/6] Symlink para import ──
echo -e "\n${YELLOW}[1/6] Creando symlink sunat_app → sunat-app...${NC}"
if [ ! -L "$PROJECT_ROOT/sunat_app" ]; then
    ln -s sunat-app "$PROJECT_ROOT/sunat_app"
    echo -e "${GREEN}  ✓ Symlink creado${NC}"
else
    echo -e "${GREEN}  ✓ Symlink ya existe${NC}"
fi

# ── [2/6] System deps (Linux) ──
cd "$SCRIPT_DIR"
if [[ "$(uname -s)" == "Linux" ]]; then
    echo -e "\n${YELLOW}[2/6] Verificando dependencias del sistema para Playwright...${NC}"
    MISSING=()
    for pkg in libatk1.0-0 libatk-bridge2.0-0 libcups2 libxkbcommon0 \
               libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 \
               libasound2 libpangocairo-1.0-0 libpango-1.0-0 libcairo2 \
               libatspi2.0-0 libgtk-3-0 libnss3 libxshmfence1; do
        dpkg -s "$pkg" &>/dev/null 2>&1 || MISSING+=("$pkg")
    done
    if [ ${#MISSING[@]} -gt 0 ]; then
        echo -e "${YELLOW}  Faltan ${#MISSING[@]} paquetes — se instalarán con playwright --with-deps${NC}"
    else
        echo -e "${GREEN}  ✓ Todos los paquetes del sistema están instalados${NC}"
    fi
fi

# ── [3/6] Package structure ──
echo -e "\n${YELLOW}[3/6] Asegurando estructura de paquete Python...${NC}"
if [ ! -f "__init__.py" ]; then
    touch __init__.py
    echo -e "${GREEN}  ✓ Creado __init__.py${NC}"
else
    echo -e "${GREEN}  ✓ __init__.py ya existe${NC}"
fi

# ── [4/6] Virtual environment ──
echo -e "\n${YELLOW}[4/6] Configurando entorno virtual...${NC}"
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo -e "${GREEN}  ✓ Creado .venv${NC}"
else
    echo -e "${GREEN}  ✓ .venv ya existe${NC}"
fi
source .venv/bin/activate

# ── [5/6] Dependencias ──
echo -e "\n${YELLOW}[5/6] Instalando dependencias Python...${NC}"
pip install -r requirements.txt --quiet
echo -e "${GREEN}  ✓ Dependencias instaladas${NC}"

# ── [6/6] Playwright ──
echo -e "\n${YELLOW}[6/6] Instalando Playwright Chromium...${NC}"
if [[ "$(uname -s)" == "Linux" ]]; then
    python3 -m playwright install --with-deps chromium 2>&1 || {
        echo -e "${RED}  ⚠ --with-deps falló, intentando instalación manual...${NC}"
        if command -v sudo &>/dev/null; then
            sudo apt update && sudo apt install -y \
                libatk1.0-0 libatk-bridge2.0-0 libcups2 libxkbcommon0 \
                libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 \
                libasound2 libpangocairo-1.0-0 libpango-1.0-0 libcairo2 \
                libatspi2.0-0 libgtk-3-0 libnss3 libxshmfence1
        fi
        python3 -m playwright install chromium
    }
else
    python3 -m playwright install chromium
fi
echo -e "${GREEN}  ✓ Chromium instalado${NC}"

# ── Ready ──
echo -e "\n${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}  Todo listo. Iniciando servidor...${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "\n  ${CYAN}API:     http://localhost:8000${NC}"
echo -e "  ${CYAN}Docs:    http://localhost:8000/docs${NC}"
echo -e "  ${CYAN}Comando: uvicorn sunat_app.main:app --reload${NC}\n"

cd "$PROJECT_ROOT"
exec uvicorn sunat_app.main:app --reload --host 0.0.0.0 --port 8000
