# Estado del proyecto

## Fase actual

Fase 2 completada: bucket S3 desplegado y verificado; rol CloudFormation restringido a la política S3 autorizada. Cambios preparados para commit.

## Objetivo de la fase

Definir un bucket privado con cifrado SSE-S3, transporte HTTPS obligatorio y permisos de despliegue acotados.

## Decisiones técnicas aprobadas

- Bloquear las cuatro formas de acceso público del bucket.
- Cifrar objetos con claves administradas por S3 (SSE-S3).
- Denegar solicitudes que no usen TLS.
- Retener tanto el bucket como su política TLS al eliminar o reemplazar el stack. Esto preserva los objetos y la protección TLS, pero los recursos retenidos quedan fuera de CloudFormation y deben eliminarse manualmente si se quiere terminar su uso.
- Limitar las acciones S3 de CloudFormation al ARN con prefijo del bucket del proyecto; no permitir `s3:DeleteBucket` ni `s3:DeleteBucketPolicy`.
- Permitir solo `s3:GetObject` sobre los objetos del bucket CDK indicado para publicar assets.
- Usar Vitest como ejecutor de pruebas.
- Resolver cuenta y región mediante el perfil AWS activo del CDK CLI; no guardar credenciales en el repositorio.

## Funcionalidades implementadas

- Bucket S3 privado, SSE-S3 y TLS obligatorio en CDK.
- Retención del bucket y de la política TLS.
- Política local de ejecución acotada al prefijo real `awsserverlessfilemanagers-filemanagerbucket261a0de-*`, assets CDK de solo lectura, sin permisos para borrar el bucket ni retirar su política.
- Pruebas para configuración del bucket, cifrado, bloqueo público, TLS, retención y alcance de permisos.

## Pruebas realizadas

- `pnpm test`: 7 pruebas aprobadas.
- `pnpm build`: correcto.
- `pnpm exec cdk synth --quiet`: correcto; una advertencia informativa de feature flags de CDK.
- AWS: stack `CREATE_COMPLETE`; bucket `awsserverlessfilemanagers-filemanagerbucket261a0de-kmgmzw7v1zlf` verificado con los cuatro bloqueos públicos, cifrado AES256, política TLS y retención del bucket y la política.
- `git diff --check`: correcto.

## Pendientes y errores

- Perfil CLI e identidad IAM confirmados como `dev-cdk` (no-root), cuenta del proyecto, región `us-east-1`.
- IAM Access Analyzer: 0 findings. La simulación de la política local permitió crear/configurar el bucket real y leer assets CDK; denegó borrar bucket/política, administrar otro bucket y escribir en assets CDK.
- Con autorización explícita se instaló la política inline `FileManagerS3ExecutionPolicy` en el rol `cdk-hnb659fds-cfn-exec-role-151298016029-us-east-1` y se retiró `AdministratorAccess`. La lectura posterior confirmó cero políticas administradas adjuntas, una única política inline y coincidencia exacta con el JSON del repositorio.
- `simulate-principal-policy` sobre el rol real confirmó permisos para crear/configurar el bucket y leer assets CDK; denegación implícita para borrar bucket/política, administrar otro bucket, escribir assets CDK, crear roles IAM y crear funciones Lambda. La simulación no sustituye un despliegue real: el despliegue inicial se realizó antes de restringir el rol, y no se ejecutó otro despliegue después.
- Solo el stack de File Manager entre los stacks activos examinados usa ese rol. El rol ahora limita las futuras operaciones de CloudFormation a los permisos de la política S3; los despliegues de otros servicios necesitan permisos adicionales.
- El plan Free está `ACTIVE`, con USD 120 en créditos y expiración `2027-04-21T03:41:17Z`. La consulta de ofertas Free Tier para S3 devolvió una lista vacía; no se interpreta como costo cero de S3.
- `cdk diff` publicó temporalmente una plantilla JSON de 2,920 bytes en el bucket de assets CDK. Con autorización del usuario se eliminó su única versión; la verificación confirmó cero versiones y cero delete markers.
- No se hizo re-bootstrap. El ajuste IAM se realizó fuera de la plantilla del stack de aplicación; revisar `infra/iam/README.md` antes de reconstruir el bootstrap, pues sus políticas podrían sobrescribir este ajuste.
- `infra/iam/cloudformation-execution-policy.json` ya tenía cambios del usuario antes de esta tarea; se preservó su alcance y se retiraron los permisos de borrado autorizados.

## Próximo paso

Confirmar el commit preparado y acordar el inicio de la siguiente fase. Antes de desplegar Lambda, API Gateway o DynamoDB, ampliar y validar explícitamente los permisos necesarios del rol de CloudFormation. No se inicia otra fase automáticamente.
