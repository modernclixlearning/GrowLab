/**
 * Smoke test de la configuración de Cloudflare R2 (F4 — image pipeline).
 *
 * Valida la cadena COMPLETA con un objeto de prueba real:
 *   1. Las 5 env vars R2_* están presentes.
 *   2. Se puede generar una presigned PUT URL (credenciales + endpoint + bucket).
 *   3. El PUT real sube los bytes (esto prueba CORS no aplica: es server-side).
 *   4. La R2_PUBLIC_BASE_URL sirve el objeto públicamente (GET 200 + bytes iguales).
 *   5. Limpieza: borra el objeto de prueba.
 *
 * Uso (desde la raíz del repo):
 *   npx tsx scripts/smoke-r2.ts
 *
 * No imprime secretos. Sale con código 1 si cualquier paso falla.
 */
import { config } from 'dotenv'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Carga .env.local (mismo archivo que edita el dev), con fallback a .env
config({ path: '.env.local' })
config({ path: '.env' })

const ok = (m: string) => console.log(`  \x1b[32m✓\x1b[0m ${m}`)
const bad = (m: string) => console.log(`  \x1b[31m✗\x1b[0m ${m}`)
const fail = (m: string): never => { bad(m); process.exit(1) }

async function main() {
  console.log('\n── Smoke test R2 ──────────────────────────────\n')

  // 1. Env vars
  const required = [
    'R2_ENDPOINT',
    'R2_BUCKET_NAME',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_PUBLIC_BASE_URL',
  ] as const
  const missing = required.filter((k) => !process.env[k])
  if (missing.length) fail(`Faltan env vars: ${missing.join(', ')}`)
  ok('Las 5 variables R2_* están presentes')
  console.log(`    endpoint:    ${process.env.R2_ENDPOINT}`)
  console.log(`    bucket:      ${process.env.R2_BUCKET_NAME}`)
  console.log(`    public base: ${process.env.R2_PUBLIC_BASE_URL}`)
  console.log(`    access key:  ${process.env.R2_ACCESS_KEY_ID!.slice(0, 4)}… (oculta)\n`)

  const client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
  const bucket = process.env.R2_BUCKET_NAME!
  const key = `smoke/r2-smoke-${Date.now()}.txt`
  const body = `growlab r2 smoke ${new Date().toISOString()}`
  const contentType = 'text/plain'

  // 2. Presigned PUT
  let uploadUrl: string
  try {
    uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
      { expiresIn: 300 },
    )
    ok('Presigned PUT URL generada')
  } catch (e) {
    return fail(`No se pudo firmar la URL (¿credenciales/endpoint?): ${(e as Error).message}`)
  }

  // 3. PUT real
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body,
  })
  if (!put.ok) return fail(`PUT falló: HTTP ${put.status} ${put.statusText} (¿bucket existe? ¿permisos del token?)`)
  ok(`Upload real OK (HTTP ${put.status})`)

  // 4. GET público
  const publicUrl = `${process.env.R2_PUBLIC_BASE_URL!.replace(/\/$/, '')}/${key}`
  console.log(`    GET ${publicUrl}`)
  const get = await fetch(publicUrl)
  if (!get.ok) {
    bad(`GET público falló: HTTP ${get.status}`)
    console.log('    → El upload funciona pero el bucket NO sirve público.')
    console.log('      Activá "Public Development URL" o un dominio público en R2,')
    console.log('      y poné esa URL en R2_PUBLIC_BASE_URL.')
    await cleanup(client, bucket, key)
    process.exit(1)
  }
  const got = await get.text()
  if (got !== body) return fail(`GET devolvió contenido distinto al subido`)
  ok(`Servido público OK (HTTP ${get.status}, bytes coinciden)`)

  // 5. Cleanup
  await cleanup(client, bucket, key)
  ok('Objeto de prueba borrado')

  console.log('\n\x1b[32m✓ R2 está correctamente configurado y operativo.\x1b[0m\n')
}

async function cleanup(client: S3Client, Bucket: string, Key: string) {
  try {
    await client.send(new DeleteObjectCommand({ Bucket, Key }))
  } catch {
    /* no-op: el smoke ya cumplió su objetivo */
  }
}

main().catch((e) => fail(e.message))
