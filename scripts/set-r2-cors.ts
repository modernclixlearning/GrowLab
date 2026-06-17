/**
 * Aplica la política CORS al bucket R2 de GrowLab.
 * Permite PUT directo desde el browser (presigned URLs) tanto en dev como en prod.
 *
 * Uso: cd code && npx tsx scripts/set-r2-cors.ts
 */
import { config } from 'dotenv'
import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3'

config({ path: '.env.local' })
config({ path: '.env' })

const required = ['R2_ENDPOINT', 'R2_BUCKET_NAME', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']
const missing = required.filter((k) => !process.env[k])
if (missing.length) { console.error('Faltan env vars:', missing.join(', ')); process.exit(1) }

const client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

await client.send(new PutBucketCorsCommand({
  Bucket: process.env.R2_BUCKET_NAME!,
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedOrigins: [
          'http://localhost:3000',
          'https://growlab.onrender.com',
        ],
        AllowedMethods: ['GET', 'PUT'],
        AllowedHeaders: ['Content-Type', 'Content-Length'],
        MaxAgeSeconds: 3600,
      },
    ],
  },
}))

console.log('✓ CORS policy aplicada al bucket', process.env.R2_BUCKET_NAME)
console.log('  Orígenes permitidos:')
console.log('    http://localhost:3000')
console.log('    https://growlab.onrender.com')
console.log('  Métodos: GET, PUT')
