# sunat-app

API en FastAPI que hace scraping del portal de SUNAT para consultar empresas por nombre, RUC o documento.

## Setup

Desde esta carpeta (`sunat-app/`):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
playwright install chromium
```

> El último paso descarga el navegador que usa Playwright (~290 MB). Sin él, los endpoints fallan con 400 / "Executable doesn't exist".

## Correr el servidor

```powershell
fastapi dev main.py
```

Server en `http://localhost:8000`. Docs en `http://localhost:8000/docs`.

## Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/consulta-ruc/{ruc}` | Consulta por RUC (11 dígitos) |
| GET | `/consulta/{nombre}` | Consulta por nombre / razón social |
| GET | `/consulta-documento/{numero}?tipo_documento=1` | Consulta por DNI / CE / Pasaporte |
| GET | `/consulta-excel` | Consulta masiva desde Excel |
| GET | `/debug-ruc/{ruc}` | Igual que `/consulta-ruc` pero con navegador visible (debug) |

Agrega `?debug=true` a cualquier consulta para abrir el navegador y ver qué pasa.

## Ejemplo

```powershell
curl http://localhost:8000/consulta-ruc/20100047218
```
