const { chromium } = require('playwright');

async function run() {
    const ruc = '10730315550';
    console.log(`[Playwright SUNAT] Iniciando navegador...`);
    const browser = await chromium.launch({ headless: true });
    
    try {
        const page = await browser.newPage();
        
        console.log(`[Playwright SUNAT] Navegando al portal de Consulta RUC...`);
        await page.goto('https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/FrameCriterioBusquedaWeb.jsp', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Esperar 2 segundos para asegurar renderizado de frames
        await page.waitForTimeout(2000);

        // SUNAT históricamente usa framesets. Buscamos el frame que contiene la caja de texto.
        let searchFrame = null;
        for (const frame of page.frames()) {
            const inputExists = await frame.$('#txtRuc');
            if (inputExists) {
                searchFrame = frame;
                break;
            }
        }

        if (!searchFrame) {
            console.log(`[Playwright SUNAT] No se encontró el input #txtRuc en ningún frame. Buscando por selectores alternativos...`);
            searchFrame = page;
        } else {
            console.log(`[Playwright SUNAT] Input #txtRuc encontrado en el frame: ${searchFrame.name() || 'sin nombre'}`);
        }

        // Ingresar el RUC
        console.log(`[Playwright SUNAT] Rellenando RUC: ${ruc}`);
        await searchFrame.fill('#txtRuc', ruc);

        // Hacer clic en buscar
        console.log(`[Playwright SUNAT] Haciendo clic en Buscar...`);
        const btn = await searchFrame.$('#btnAceptar');
        if (btn) {
            await btn.click();
        } else {
            await searchFrame.click('input[type="button"]');
        }

        // Esperar a que cargue la respuesta
        console.log(`[Playwright SUNAT] Esperando respuesta de búsqueda...`);
        await page.waitForTimeout(5000); // Espera de 5s para carga del DOM de resultados

        // Buscar en todos los frames la información resultante
        let resultsFound = false;
        for (const frame of page.frames()) {
            const html = await frame.content();
            
            if (html.includes('Número de RUC:') || html.includes('ESCOBAR PEREZ YURI ABEL')) {
                console.log(`[Playwright SUNAT] ¡Datos encontrados en el frame: ${frame.name() || 'sin nombre'}!`);
                
                // Imprimir el HTML con los datos de interés para analizarlos
                console.log('\n--- CONTENIDO HTML DE LOS RESULTADOS ---');
                
                // Intentar extraer datos clave
                const rucRegex = /Número de RUC:\s*<\/td>\s*<td[^>]*>\s*(\d{11})\s*-\s*([^<\r\n]+)/i;
                const matchRuc = html.match(rucRegex);
                if (matchRuc) {
                    console.log(`RUC extraído: ${matchRuc[1]}`);
                    console.log(`Razón Social extraída: ${matchRuc[2].trim()}`);
                }

                const estadoRegex = /Estado del Contribuyente:\s*<\/td>\s*<td[^>]*>\s*([^<\r\n]+)/i;
                const matchEstado = html.match(estadoRegex);
                if (matchEstado) {
                    console.log(`Estado del Contribuyente: ${matchEstado[1].replace(/<[^>]*>/g, '').trim()}`);
                }

                const condicionRegex = /Condición del Contribuyente:\s*<\/td>\s*<td[^>]*>\s*([^<\r\n]+)/i;
                const matchCondicion = html.match(condicionRegex);
                if (matchCondicion) {
                    console.log(`Condición del Contribuyente: ${matchCondicion[1].replace(/<[^>]*>/g, '').trim()}`);
                }
                
                resultsFound = true;
                break;
            }
        }

        if (!resultsFound) {
            console.log(`[Playwright SUNAT] No se pudieron encontrar resultados estructurados en ningún frame.`);
            console.log(`Estructura de frames detectada:`);
            page.frames().forEach((f, idx) => {
                console.log(`- Frame ${idx}: Name = "${f.name()}", URL = "${f.url()}"`);
            });
        }

    } catch (error) {
        console.error(`[Playwright SUNAT] Error durante la ejecución:`, error);
    } finally {
        console.log(`[Playwright SUNAT] Cerrando navegador...`);
        await browser.close();
    }
}

run();

