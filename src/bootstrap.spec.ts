import { spawn } from 'node:child_process'
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { ModuleKind, ScriptTarget, transpileModule } from 'typescript'

describe('Telemetry bootstrap', () => {
  it.each([
    { enabled: true, extraExporters: false },
    { enabled: false, extraExporters: false },
    { enabled: true, extraExporters: true },
  ])(
    'honors .env configuration (enabled=$enabled, extraExporters=$extraExporters)',
    async ({ enabled, extraExporters }) => {
      const projectRoot = process.cwd()
      const fixtureRoot = mkdtempSync(
        path.join(tmpdir(), 'nest-bootstrap-env-')
      )
      const exports: Buffer[] = []
      const exportPaths: string[] = []
      let acknowledgedExports = 0
      const collector = createServer((request, response) => {
        const chunks: Buffer[] = []
        request.on('data', (chunk: Buffer) => chunks.push(chunk))
        request.on('end', () => {
          exports.push(Buffer.concat(chunks))
          exportPaths.push(request.url ?? '')
          response.writeHead(200, { 'Content-Type': 'application/x-protobuf' })
          // A shutdown hook must await the export acknowledgement before exit.
          setTimeout(() => {
            response.end()
            acknowledgedExports += 1
          }, 100)
        })
      })
      await new Promise<void>((resolve) =>
        collector.listen(0, '127.0.0.1', resolve)
      )
      const address = collector.address()
      if (!address || typeof address === 'string') {
        throw new Error('Expected a TCP collector address')
      }

      try {
        // Exercise native ESM in a plain Node child, including the production loader.
        for (const name of [
          'bootstrap',
          'telemetry',
          'telemetry-shutdown.service',
        ]) {
          const { outputText } = transpileModule(
            readFileSync(path.join(projectRoot, 'src', `${name}.ts`), 'utf8'),
            {
              fileName: `${name}.ts`,
              compilerOptions: {
                module: ModuleKind.ESNext,
                target: ScriptTarget.ES2023,
                experimentalDecorators: true,
                emitDecoratorMetadata: true,
              },
            }
          )
          writeFileSync(path.join(fixtureRoot, `${name}.js`), outputText)
        }
        writeFileSync(
          path.join(fixtureRoot, 'package.json'),
          '{"type":"module"}\n'
        )
        symlinkSync(
          path.join(projectRoot, 'node_modules'),
          path.join(fixtureRoot, 'node_modules'),
          'dir'
        )
        writeFileSync(
          path.join(fixtureRoot, '.env'),
          `OTEL_ENABLED=${enabled}\nOTEL_SERVICE_NAME=bootstrap-env-fixture\nOTEL_NODE_RESOURCE_DETECTORS=none\nOTEL_BSP_SCHEDULE_DELAY=60000\nOTEL_BLRP_SCHEDULE_DELAY=60000\nOTEL_METRIC_EXPORT_INTERVAL=60000\nOTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf\nOTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:${address.port}\nOTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://127.0.0.1:${address.port}/v1/traces\n${extraExporters ? 'OTEL_LOGS_EXPORTER=otlp\nOTEL_METRICS_EXPORTER=otlp\n' : ''}`
        )
        const child = spawn(
          process.execPath,
          [
            '--experimental-loader=@opentelemetry/instrumentation/hook.mjs',
            '--input-type=module',
            '-e',
            `
          const { bootstrapApplication } = await import('./bootstrap.js');
          bootstrapApplication(async () => {
            const { Module } = await import('@nestjs/common');
            const { NestFactory } = await import('@nestjs/core');
            const { TelemetryShutdownService } = await import('./telemetry-shutdown.service.js');
            class FixtureModule {}
            Module({ providers: [TelemetryShutdownService] })(FixtureModule);
            const app = await NestFactory.createApplicationContext(FixtureModule, { logger: false });
            const { default: winston } = await import('winston');
            const logger = winston.createLogger({ transports: [new winston.transports.Console({ silent: true })] });
            logger.info('bootstrap-log-fixture');
            await new Promise(resolve => { logger.once('finish', resolve); logger.end(); });
            const { logs, metrics } = await import('@opentelemetry/api');
            logs.getLogger('bootstrap-fixture').emit({ body: 'bootstrap-otel-log-fixture', severityNumber: 9 });
            metrics.getMeter('bootstrap-fixture').createCounter('bootstrap_requests').add(1);
            const http = await import('node:http');
            const server = http.createServer((_request, response) => response.end('ok'));
            await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
            await new Promise((resolve, reject) => {
              http.get('http://127.0.0.1:' + server.address().port + '/', response => {
                response.resume();
                response.on('end', resolve);
              }).on('error', reject);
            });
            await new Promise(resolve => server.close(resolve));
            await app.close();
            process.exit(0);
          }).catch(error => { console.error(error); process.exitCode = 1; });
          `,
          ],
          {
            cwd: fixtureRoot,
            env: {
              ...Object.fromEntries(
                Object.entries(process.env).filter(
                  ([key]) => !key.startsWith('OTEL_')
                )
              ),
            },
            stdio: ['ignore', 'pipe', 'pipe'],
            timeout: 30_000,
          }
        )
        let output = ''
        child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()))
        child.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()))
        const code = await new Promise<number | null>((resolve, reject) => {
          child.once('error', reject)
          child.once('exit', resolve)
        })
        expect({ code, output: code === 0 ? '' : output }).toEqual({
          code: 0,
          output: '',
        })
        const payload = Buffer.concat(exports)
        expect(
          payload.includes(Buffer.from('@opentelemetry/instrumentation-http'))
        ).toBe(enabled)
        expect(payload.includes(Buffer.from('GET'))).toBe(enabled)
        expect(payload.includes(Buffer.from('bootstrap-env-fixture'))).toBe(
          enabled
        )
        expect(payload.length > 0).toBe(enabled)
        expect(acknowledgedExports > 0).toBe(enabled)
        expect(new Set(exportPaths)).toEqual(
          new Set(
            enabled
              ? extraExporters
                ? ['/v1/traces', '/v1/logs', '/v1/metrics']
                : ['/v1/traces']
              : []
          )
        )
      } finally {
        await new Promise<void>((resolve, reject) =>
          collector.close((error) => (error ? reject(error) : resolve()))
        )
        rmSync(fixtureRoot, { recursive: true, force: true })
      }
    },
    40_000
  )
})
