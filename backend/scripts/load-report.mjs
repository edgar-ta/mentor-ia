import autocannon from 'autocannon';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const target = process.env.LOAD_TEST_URL || 'http://localhost:4000/';
const connections = Number(process.env.LOAD_TEST_CONNECTIONS || 20);
const duration = Number(process.env.LOAD_TEST_DURATION || 30);
const reportDirectory = path.resolve('reports', 'load');

if (!Number.isInteger(connections) || connections < 1) {
  throw new Error('LOAD_TEST_CONNECTIONS debe ser un entero mayor que 0.');
}

if (!Number.isInteger(duration) || duration < 1) {
  throw new Error('LOAD_TEST_DURATION debe ser un entero mayor que 0.');
}

const healthUrl = new URL('/api/health', target);
try {
  const response = await fetch(healthUrl);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
} catch (error) {
  throw new Error(`No se pudo conectar a ${healthUrl}. Inicia la aplicacion antes de ejecutar la prueba. (${error.message})`);
}

console.log(`Prueba de carga: ${target}`);
console.log(`Conexiones: ${connections}; duracion: ${duration}s`);

const result = await new Promise((resolve, reject) => {
  const instance = autocannon({
    url: target,
    connections,
    duration,
    pipelining: 1,
    method: 'GET',
    headers: { accept: 'text/html' }
  }, (error, output) => (error ? reject(error) : resolve(output)));

  autocannon.track(instance, { renderProgressBar: true, renderResultsTable: true });
});

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const report = {
  generatedAt: new Date().toISOString(),
  target,
  configuration: { connections, duration, pipelining: 1 },
  summary: {
    requests: result.requests,
    latency: result.latency,
    throughput: result.throughput,
    errors: result.errors,
    timeouts: result.timeouts,
    non2xx: result.non2xx,
    statusCodeStats: result.statusCodeStats
  }
};

await mkdir(reportDirectory, { recursive: true });
const jsonPath = path.join(reportDirectory, `autocannon-${timestamp}.json`);
const markdownPath = path.join(reportDirectory, `autocannon-${timestamp}.md`);
const requestsPerSecond = result.requests.average.toFixed(2);
const p99Latency = result.latency.p99.toFixed(2);

await Promise.all([
  writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`),
  writeFile(markdownPath, `# Reporte de carga\n\n- Fecha: ${report.generatedAt}\n- URL: ${target}\n- Conexiones: ${connections}\n- Duracion: ${duration} s\n- Solicitudes por segundo (promedio): ${requestsPerSecond}\n- Latencia p99: ${p99Latency} ms\n- Errores: ${result.errors}\n- Timeouts: ${result.timeouts}\n- Respuestas no 2xx: ${result.non2xx}\n\nConsulta el archivo JSON del mismo reporte para las metricas completas.\n`)
]);

console.log(`\nReportes creados:\n- ${jsonPath}\n- ${markdownPath}`);
