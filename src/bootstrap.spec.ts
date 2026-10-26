import { spawn } from 'node:child_process'
import { createServer } from 'node:http'

describe('Telemetry bootstrap', () => {
  it('exports HTTP spans for modules loaded by the application callback', async () => {
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
      const child = spawn(
        process.execPath,
        [
          '--require',
          'ts-node/register',
          '-e',
          `
          const { bootstrapApplication } = require('./src/bootstrap');
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
            await require('./src/telemetry').shutdownTelemetry();
          }).catch(error => { console.error(error); process.exitCode = 1; });
          `,
        ],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            TS_NODE_SKIP_PROJECT: 'true',
            TS_NODE_TRANSPILE_ONLY: 'true',
            TS_NODE_COMPILER_OPTIONS: JSON.stringify({
              module: 'CommonJS',
              moduleResolution: 'Node',
              ignoreDeprecations: '6.0',
            }),
            OTEL_ENABLED: 'true',
            OTEL_NODE_RESOURCE_DETECTORS: 'none',
            OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: `http://127.0.0.1:${address.port}/v1/traces`,
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
      ).toBe(true)
      expect(payload.includes(Buffer.from('GET'))).toBe(true)
    } finally {
      await new Promise<void>((resolve, reject) =>
        collector.close((error) => (error ? reject(error) : resolve()))
      )
    }
  }, 40_000)
})
