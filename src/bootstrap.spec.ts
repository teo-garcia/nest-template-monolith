import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { ModuleKind, ScriptTarget, transpileModule } from 'typescript'

describe('Telemetry bootstrap', () => {
  it.each([true, false])(
    'honors .env tracing configuration (enabled=%s)',
    async (enabled) => {
      const projectRoot = process.cwd()
      const fixtureRoot = mkdtempSync(
        path.join(tmpdir(), 'nest-bootstrap-env-')
      )
      const exports: Buffer[] = []
      const collector = createServer((request, response) => {
        const chunks: Buffer[] = []
        request.on('data', (chunk: Buffer) => chunks.push(chunk))
        request.on('end', () => {
          exports.push(Buffer.concat(chunks))
          response.writeHead(200, { 'Content-Type': 'application/x-protobuf' })
          response.end()
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
        // Exercise the same Node16 module output as the production build.
        for (const name of ['bootstrap', 'telemetry']) {
          const { outputText } = transpileModule(
            readFileSync(path.join(projectRoot, 'src', `${name}.ts`), 'utf8'),
            {
              fileName: `${name}.ts`,
              compilerOptions: {
                module: ModuleKind.Node16,
                target: ScriptTarget.ES2023,
              },
            }
          )
          writeFileSync(path.join(fixtureRoot, `${name}.js`), outputText)
        }
        writeFileSync(
          path.join(fixtureRoot, '.env'),
          `OTEL_ENABLED=${enabled}\nOTEL_SERVICE_NAME=bootstrap-env-fixture\nOTEL_NODE_RESOURCE_DETECTORS=none\nOTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://127.0.0.1:${address.port}/v1/traces\n`
        )
        const child = spawn(
          process.execPath,
          [
            '-e',
            `
          const { bootstrapApplication } = require('./bootstrap.js');
          bootstrapApplication(async () => {
            const http = require('node:http');
            const server = http.createServer((_request, response) => response.end('ok'));
            await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
            await new Promise((resolve, reject) => {
              http.get('http://127.0.0.1:' + server.address().port + '/', response => {
                response.resume();
                response.on('end', resolve);
              }).on('error', reject);
            });
            await new Promise(resolve => server.close(resolve));
            await require('./telemetry.js').shutdownTelemetry();
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
              NODE_PATH: path.join(projectRoot, 'node_modules'),
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
