import asyncio
import logging
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from playwright.sync_api import sync_playwright
import uvicorn

# ---------------------------------------------------------------------------
# Config logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("sunat_scraper")

# ---------------------------------------------------------------------------
# Config desde environment / defaults
# ---------------------------------------------------------------------------
SUNAT_URL = os.getenv(
    "SUNAT_URL",
    "https://e-consultaruc.sunat.gob.pe/cl-ti-itconsruc/FrameCriterioBusquedaWeb.jsp",
)
USER_AGENT = os.getenv(
    "USER_AGENT",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
)
NAVIGATION_TIMEOUT = int(os.getenv("NAVIGATION_TIMEOUT", "60000"))
RESULT_TIMEOUT = int(os.getenv("RESULT_TIMEOUT", "20000"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))
RETRY_BACKOFF = int(os.getenv("RETRY_BACKOFF", "2"))

_executor = ThreadPoolExecutor(max_workers=2)

app = FastAPI(title="SUNAT RUC Consulta API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


def _run_sync(fn, *args):
    """Ejecuta una función síncrona en un thread pool y retorna el resultado."""
    loop = asyncio.get_running_loop()
    return loop.run_in_executor(_executor, fn, *args)


# ---------------------------------------------------------------------------
# Mapeo de Tipo Contribuyente SUNAT -> EnterpriseType
# ---------------------------------------------------------------------------
def map_enterprise_type(tipo_raw: str) -> str:
    tipo = tipo_raw.upper().strip()
    if "GOBIERNO CENTRAL" in tipo or "GOBIERNO REGIONAL" in tipo or "GOBIERNO LOCAL" in tipo:
        return "GOBIERNO_NACIONAL"
    if "SOCIEDAD ANONIMA" in tipo or "S.A." in tipo:
        return "EMPRESA_NACIONAL"
    if "EMPRESA INDIVIDUAL DE RESP" in tipo:
        return "EMPRESA_NACIONAL"
    if "SOCIEDAD COMERCIAL DE RESPONSABILIDAD LIMITADA" in tipo or "S.R.L." in tipo:
        return "EMPRESA_NACIONAL"
    if "PERSONA NATURAL CON NEGOCIO" in tipo:
        return "INDEPENDIENTE"
    if "PERSONA NATURAL SIN NEGOCIO" in tipo:
        return "INDEPENDIENTE"
    if "ASOCIACION" in tipo or "FUNDACION" in tipo or "COMITE" in tipo:
        return "ONG"
    if "ORGANISMO INTERNACIONAL" in tipo:
        return "ORGANISMO_INTERNACIONAL"
    if "EMPRESA EXTRANJERA" in tipo or "SOCIEDAD EXTRANJERA" in tipo:
        return "EMPRESA_INTERNACIONAL"
    if "CENTRO EDUCATIVO" in tipo or "UNIVERSIDAD" in tipo or "INSTITUTO SUPERIOR" in tipo:
        return "ACADEMIA"
    return "EMPRESA_NACIONAL"


# ---------------------------------------------------------------------------
# Mapeo de código CIIU -> Sector
# ---------------------------------------------------------------------------
_CIIU_SECTOR = {
    "01": "AGRICOLA", "02": "FORESTAL", "03": "PESCA",
    "05": "MINERIA",
    "10": "ALIMENTARIA", "11": "ALIMENTARIA", "12": "ALIMENTARIA",
    "13": "TEXTIL", "14": "TEXTIL",
    "15": "MANUFACTURA", "16": "MANUFACTURA", "17": "MANUFACTURA",
    "18": "MANUFACTURA", "19": "MANUFACTURA", "20": "MANUFACTURA",
    "21": "MANUFACTURA", "22": "MANUFACTURA", "23": "MANUFACTURA",
    "24": "MANUFACTURA", "25": "MANUFACTURA",
    "26": "TECNOLOGIA",
    "27": "MANUFACTURA", "28": "MANUFACTURA", "29": "MANUFACTURA",
    "30": "MANUFACTURA", "31": "MANUFACTURA", "32": "MANUFACTURA",
    "33": "MANUFACTURA",
    "35": "ENERGIA",
    "36": "MANUFACTURA",
    "41": "CONSTRUCCION", "42": "CONSTRUCCION", "43": "CONSTRUCCION",
    "55": "TURISMO", "56": "TURISMO",
    "58": "TECNOLOGIA", "59": "TECNOLOGIA",
    "60": "TECNOLOGIA", "61": "TECNOLOGIA",
    "62": "INFORMATICA", "63": "INFORMATICA",
    "64": "FINANZAS", "65": "BANCA_Y_SEGUROS", "66": "BANCA_Y_SEGUROS",
    "69": "ASESORIA", "70": "ASESORIA", "71": "ASESORIA",
    "72": "CONSULTORIA", "73": "CONSULTORIA",
    "74": "ASESORIA", "75": "ASESORIA",
    "84": "ADMINISTRACION_PUBLICA",
    "85": "EDUCACION",
    "86": "SALUD", "87": "SALUD", "88": "SALUD",
}


def derive_sector(actividad: str) -> str | None:
    m = re.search(r'(\d{4})', actividad)
    if not m:
        return None
    return _CIIU_SECTOR.get(m.group(1)[:2], "OTROS")


# ---------------------------------------------------------------------------
# Normalización de datos extraídos de SUNAT
# ---------------------------------------------------------------------------
SUNAT_FIELD_MAP = {
    "TIPO CONTRIBUYENTE":       "tipoContribuyente",
    "NOMBRE COMERCIAL":         "nombreComercial",
    "ESTADO DEL CONTRIBUYENTE": "estado",
    "CONDICIÓN DEL CONTRIBUYENTE": "condicion",
    "CONDICION DEL CONTRIBUYENTE": "condicion",
    "DOMICILIO FISCAL":         "ubicacion",
    "FECHA DE INSCRIPCIÓN":     "fechaInscripcion",
    "FECHA DE INSCRIPCION":     "fechaInscripcion",
    "FECHA DE INICIO DE ACTIVIDADES": "fechaInicioActividades",
    "ACTIVIDAD(ES) ECONÓMICA(S)": "actividadEconomica",
    "ACTIVIDAD(ES) ECONOMICA(S)": "actividadEconomica",
    "ACTIVIDADES ECONÓMICAS":   "actividadEconomica",
    "ACTIVIDADES ECONOMICAS":   "actividadEconomica",
    "SISTEMA EMISIÓN DE COMPROBANTE": "sistemaEmision",
    "SISTEMA EMISION DE COMPROBANTE": "sistemaEmision",
    "ACTIVIDAD COMERCIO EXTERIOR": "actividadComercioExterior",
    "SISTEMA CONTABILIDAD":     "sistemaContabilidad",
    "COMPROBANTES DE PAGO C/AUT. DE IMPRESIÓN (F. 806 U 816)": "comprobantesPago",
    "COMPROBANTES DE PAGO C/AUT. DE IMPRESION (F. 806 U 816)": "comprobantesPago",
    "SISTEMA DE EMISIÓN ELECTRÓNICA": "sistemaEmisionElectronica",
    "SISTEMA DE EMISION ELECTRONICA": "sistemaEmisionElectronica",
    "EMISOR ELECTRÓNICO DESDE": "emisorElectronicoDesde",
    "EMISOR ELECTRONICO DESDE": "emisorElectronicoDesde",
    "COMPROBANTES ELECTRÓNICOS": "comprobantesElectronicos",
    "COMPROBANTES ELECTRONICOS": "comprobantesElectronicos",
    "AFILIADO AL PLE DESDE":    "afiliadoPLEDesde",
    "PADRONES":                 "padrones",
}


def normalize_sunat_data(raw: dict) -> dict:
    result = {}

    for k, v in raw.items():
        k_stripped = k.rstrip(":").strip()
        k_upper = k_stripped.upper()

        if "RUC" in k_upper and " - " in v:
            parts = v.split(" - ", 1)
            result["ruc"] = parts[0].strip()
            result["nombre"] = parts[1].strip()
            continue

        mapped = SUNAT_FIELD_MAP.get(k_upper)
        if mapped:
            result[mapped] = v
            continue

        result[k_stripped] = v

    tipo_raw = result.get("tipoContribuyente", "")
    if tipo_raw:
        result["tipo"] = map_enterprise_type(tipo_raw)

    actividad = result.get("actividadEconomica", "")
    if actividad:
        result["sector"] = derive_sector(actividad)

    result.setdefault("tamano", None)
    result.setdefault("subArea", None)
    result["_raw"] = raw

    return result


# ---------------------------------------------------------------------------
# Scraper por RUC (síncrono, corre en thread pool)
# ---------------------------------------------------------------------------
def _sync_check_blocked(page) -> str | None:
    body = page.inner_text("body").lower()
    bloqueos = ["acceso denegado", "demasiadas solicitudes", "rate limit",
                "bloqueado", "mantenimiento", "servicio no disponible"]
    for palabra in bloqueos:
        if palabra in body:
            log.warning("Posible bloqueo detectado: '%s'", palabra)
            return f"SUNAT parece estar bloqueando la consulta ({palabra}). Intenta más tarde."
    return None


def _sync_navigate(page, url: str):
    last_err = None
    for intento in range(MAX_RETRIES):
        try:
            log.info("Navegando a SUNAT (intento %d/%d)", intento + 1, MAX_RETRIES)
            page.goto(url, timeout=NAVIGATION_TIMEOUT, wait_until="domcontentloaded")
            log.info("Página cargada: %s", page.url)
            return
        except Exception as e:
            last_err = e
            delay = RETRY_BACKOFF * (2 ** intento)
            log.warning("Intento %d falló: %s. Reintentando en %ds...", intento + 1, e, delay)
            time.sleep(delay)
    raise HTTPException(status_code=503, detail="No se pudo conectar con SUNAT")


def _sync_scrape_by_ruc(ruc: str) -> dict:
    log.info("Iniciando consulta RUC: %s", ruc)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, args=["--disable-gpu", "--no-sandbox"])
        log.debug("Browser lanzado")
        context = browser.new_context(user_agent=USER_AGENT)
        page = context.new_page()

        try:
            _sync_navigate(page, SUNAT_URL)

            bloqueo = _sync_check_blocked(page)
            if bloqueo:
                raise HTTPException(status_code=503, detail=bloqueo)

            page.wait_for_selector("#btnPorRuc", timeout=10000)
            page.wait_for_selector("#txtRuc", timeout=10000)

            page.click("#btnPorRuc")
            page.fill("#txtRuc", ruc)
            log.debug("Formulario llenado con RUC: %s", ruc)

            bloqueo = _sync_check_blocked(page)
            if bloqueo:
                raise HTTPException(status_code=503, detail=bloqueo)

            page.click("#btnAceptar")
            log.debug("Click en Buscar")

            try:
                page.wait_for_selector(".list-group-item", timeout=RESULT_TIMEOUT)
                log.info("Resultados encontrados para RUC %s", ruc)
            except Exception:
                body = page.inner_text("body")
                bloqueo = _sync_check_blocked(page)
                if bloqueo:
                    raise HTTPException(status_code=503, detail=bloqueo)
                if "Criterios de la b" in body:
                    log.warning("RUC %s no encontrado en SUNAT", ruc)
                    raise HTTPException(status_code=404, detail=f"RUC {ruc} no encontrado en SUNAT")
                log.error("Timeout esperando resultados para RUC %s", ruc)
                raise HTTPException(status_code=503, detail="SUNAT no respondió a tiempo. Intenta de nuevo.")

            raw = {}
            items = page.query_selector_all(".list-group-item")
            log.debug("Extrayendo %d items de resultado", len(items))

            for item in items:
                row = item.query_selector(".row")
                if not row:
                    continue
                cols = row.query_selector_all("> div")
                i = 0
                while i < len(cols):
                    header_el = cols[i].query_selector("h4")
                    if not header_el:
                        i += 1
                        continue
                    key = header_el.inner_text().strip()

                    if i + 1 < len(cols):
                        val_col = cols[i + 1]
                        table = val_col.query_selector("table")
                        if table:
                            tds = table.query_selector_all("tr td")
                            values = [td.inner_text().strip() for td in tds if td.inner_text().strip()]
                            value = "\n".join(values)
                        else:
                            p_el = val_col.query_selector("p")
                            h4_val = val_col.query_selector("h4")
                            if p_el:
                                value = p_el.inner_text().strip()
                            elif h4_val:
                                value = h4_val.inner_text().strip()
                            else:
                                value = val_col.inner_text().strip()
                        raw[key] = value
                        i += 2
                    else:
                        raw[key] = ""
                        i += 1

            log.info("Consulta RUC %s completada: %d campos extraídos", ruc, len(raw))
            return normalize_sunat_data(raw)

        except HTTPException:
            raise
        except Exception as e:
            log.exception("Error inesperado consultando RUC %s", ruc)
            raise HTTPException(status_code=503, detail=f"SUNAT error: {str(e)}")
        finally:
            try:
                browser.close()
            except Exception:
                pass


# Scraper por nombre
# ---------------------------------------------------------------------------
def _parse_aruc_element(ruc: str, h4_texts: list[str], p_texts: list[str]) -> dict:
    nombre = h4_texts[1].strip() if len(h4_texts) > 1 else None
    ubicacion = None
    estado = None
    for t in p_texts:
        t = t.strip()
        if t.startswith("Ubicaci"):
            ubicacion = t.split(":", 1)[1].strip() if ":" in t else None
        elif t.startswith("Estado"):
            estado = t.split(":", 1)[1].strip() if ":" in t else None
    return {"ruc": ruc, "nombre": nombre, "ubicacion": ubicacion or None, "estado": estado or None}


def _sync_scrape_by_nombre(nombre: str) -> list:
    log.info("Iniciando consulta por nombre: %s", nombre)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, args=["--disable-gpu", "--no-sandbox"])
        context = browser.new_context(user_agent=USER_AGENT)
        page = context.new_page()

        try:
            _sync_navigate(page, SUNAT_URL)

            bloqueo = _sync_check_blocked(page)
            if bloqueo:
                raise HTTPException(status_code=503, detail=bloqueo)

            page.get_by_text("Por Nomb./Raz.Soc.").click()
            page.get_by_role("textbox").fill(nombre)
            page.get_by_role("button", name="Buscar").click()
            log.debug("Búsqueda por nombre enviada: %s", nombre)

            bloqueo = _sync_check_blocked(page)
            if bloqueo:
                raise HTTPException(status_code=503, detail=bloqueo)

            try:
                page.wait_for_selector(".panel-heading", timeout=RESULT_TIMEOUT)
            except Exception:
                raise HTTPException(status_code=503, detail="SUNAT no respondió a tiempo.")

            headings = [h.inner_text().strip() for h in page.query_selector_all(".panel-heading")]
            log.debug("Panel headings: %s", headings)

            HEADING_RESULTS = "Relación de contribuyentes"
            HEADING_NO_RESULTS = "Resultado de la B"

            if any(HEADING_RESULTS in t for t in headings):
                arucs = page.query_selector_all(".aRucs")
                resultados = []
                seen = set()
                for a in arucs:
                    ruc_val = a.get_attribute("data-ruc")
                    if not ruc_val or ruc_val in seen:
                        continue
                    seen.add(ruc_val)
                    h4_texts = [h.inner_text() for h in a.query_selector_all("h4")]
                    p_texts = [p.inner_text() for p in a.query_selector_all("p")]
                    resultados.append(_parse_aruc_element(ruc_val, h4_texts, p_texts))
                log.info("Consulta por nombre '%s': %d resultados", nombre, len(resultados))
                return resultados

            elif any(HEADING_NO_RESULTS in t for t in headings):
                body = page.inner_text("body")
                if "NO REGISTRA" in body:
                    log.info("Nombre '%s' sin resultados en SUNAT", nombre)
                    return []
                log.warning("Resultado inesperado para '%s'", nombre)
                return []

            else:
                log.warning("Estado inesperado: %s", headings)
                return []

        except HTTPException:
            raise
        except Exception as e:
            log.exception("Error en consulta por nombre '%s'", nombre)
            raise HTTPException(status_code=503, detail=f"SUNAT error: {str(e)}")
        finally:
            try:
                browser.close()
            except Exception:
                pass


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/consultar-ruc")
async def consultar_por_ruc(ruc: str):
    if len(ruc) != 11 or not ruc.isdigit():
        log.warning("RUC inválido recibido: %s", ruc)
        raise HTTPException(status_code=400, detail="RUC debe tener 11 dígitos numéricos")
    return await _run_sync(_sync_scrape_by_ruc, ruc)


@app.get("/consultar-nombre")
async def consultar_por_nombre(nombre: str):
    nombre = nombre.strip()
    if len(nombre) < 3:
        raise HTTPException(status_code=400, detail="Ingresa al menos 3 caracteres")
    return await _run_sync(_sync_scrape_by_nombre, nombre)


@app.get("/health")
async def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    log.info("Iniciando servidor en puerto %d", port)
    uvicorn.run(app, host="0.0.0.0", port=port)
