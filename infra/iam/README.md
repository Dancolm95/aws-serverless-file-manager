# Política de ejecución de CloudFormation

El stack usa el rol `cdk-hnb659fds-cfn-exec-role-151298016029-us-east-1`.
La política inline `FileManagerS3ExecutionPolicy` contiene exactamente
`cloudformation-execution-policy.json`. `AdministratorAccess` fue retirada
con autorización del usuario.

## Alcance

- Acciones de creación, lectura y configuración del bucket con prefijo
  `awsserverlessfilemanagers-filemanagerbucket261a0de-*`.
- Lectura de objetos del bucket de assets del bootstrap de esta cuenta/región.
- No concede borrado de bucket/política, escritura de assets ni administración
  de Lambda, DynamoDB, API Gateway o IAM.

El prefijo se verificó contra el nombre físico desplegado. Renombrar el stack,
cambiar el logical ID o recrearlo requiere revisar el patrón antes de desplegar.
El bucket y su política TLS tienen Retain; una limpieza manual necesita permisos
y autorización específicos.

## Reproducción del ajuste autorizado

El rol pertenece al bootstrap CDK compartido. Este ajuste IAM se aplicó por CLI,
fuera de la plantilla del stack de aplicación. No es una modificación incorporada
al template de CDKToolkit. Un re-bootstrap puede alterar las políticas del rol;
revisar su plantilla y configuración antes de ejecutarlo. Este archivo no autoriza
ninguna operación AWS por sí mismo.

Con autorización explícita y una identidad no-root verificada, desde la raíz del
repositorio se puede reproducir el ajuste:

```bash
aws iam put-role-policy --profile dev-cdk \
  --role-name cdk-hnb659fds-cfn-exec-role-151298016029-us-east-1 \
  --policy-name FileManagerS3ExecutionPolicy \
  --policy-document file://infra/iam/cloudformation-execution-policy.json
```

Leer la política instalada y compararla con el JSON antes de retirar el permiso
amplio. Después, si AdministratorAccess sigue adjunta y su retirada está autorizada:

```bash
aws iam detach-role-policy --profile dev-cdk \
  --role-name cdk-hnb659fds-cfn-exec-role-151298016029-us-east-1 \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

Verificar las políticas adjuntas e inline y simular los permisos del rol real.
Las simulaciones verifican decisiones de autorización para los casos probados;
no demuestran que todos los caminos de actualización o rollback de CloudFormation
funcionen. El despliegue inicial fue previo a la restricción del rol.

Antes de añadir otros servicios al stack, ampliar la política con acciones y
recursos concretos, revisar el impacto, obtener autorización y validar el cambio.
