import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions'

const telemetryEnabled = process.env.OTEL_ENABLED !== 'false'

let sdk: NodeSDK | undefined

export async function startTelemetry(): Promise<void> {
  if (!telemetryEnabled || sdk) {
    return
  }

  const serviceName = process.env.OTEL_SERVICE_NAME || 'nest-template-monolith'
  const serviceVersion = process.env.API_VERSION || '1'
  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
    'http://localhost:4318/v1/traces'

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: serviceVersion,
    }),
    traceExporter: new OTLPTraceExporter({ url: endpoint }),
    instrumentations: [getNodeAutoInstrumentations()],
  })

  await sdk.start()
}

export async function shutdownTelemetry(): Promise<void> {
  await sdk?.shutdown()
}
