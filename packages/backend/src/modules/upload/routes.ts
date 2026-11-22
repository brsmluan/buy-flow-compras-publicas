// =============================================================================
// BUY-FLOW BACKEND - Upload Routes
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma.js';
import { AppError } from '../../../middleware/error.js';
import { authorize, requirePermission, requireTenantAccess } from '../../../middleware/auth.js';
import { env } from '../../../config/index.js';

export async function uploadRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireTenantAccess());

  app.post('/', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('upload:create')] }, async (request, reply) => {
    const data = await request.file();

    if (!data) {
      throw AppError.badRequest('NO_FILE', 'Nenhum arquivo enviado');
    }

    const allowedTypes = (env.ALLOWED_MIME_TYPES || 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png').split(',');
    if (!allowedTypes.includes(data.mimetype)) {
      throw AppError.badRequest('INVALID_FILE_TYPE', `Tipo de arquivo não permitido: ${data.mimetype}`);
    }

    const maxSize = env.MAX_FILE_SIZE || 52428800;
    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length > maxSize) {
      throw AppError.badRequest('FILE_TOO_LARGE', `Arquivo muito grande. Máximo: ${maxSize} bytes`);
    }

    const fileName = `${Date.now()}-${data.filename}`;
    const filePath = `uploads/${request.user!.tenantId}/${fileName}`;

    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.dirname(filePath);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.writeFileSync(filePath, buffer);

    const uploadRecord = await prisma.upload.create({
      data: {
        tenantId: request.user!.tenantId!,
        fileName: data.filename,
        storedName: fileName,
        mimeType: data.mimetype,
        size: buffer.length,
        path: filePath,
        uploadedById: request.user!.sub,
      },
    });

    return reply.code(201).send({
      success: true,
      data: {
        upload: {
          id: uploadRecord.id,
          fileName: data.filename,
          mimeType: data.mimetype,
          size: buffer.length,
          url: `/api/v1/upload/${uploadRecord.id}`,
        },
      },
    });
  });

  app.get('/:id', { preHandler: authorize('tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer') }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const tenantId = request.user!.tenantId!;

    const upload = await prisma.upload.findFirst({
      where: { id, tenantId },
    });

    if (!upload) throw AppError.notFound('UPLOAD_NOT_FOUND', 'Arquivo não encontrado');

    const fs = require('fs');
    const path = require('path');

    if (!fs.existsSync(upload.path)) {
      throw AppError.notFound('FILE_NOT_FOUND', 'Arquivo não encontrado no disco');
    }

    return reply.sendFile(upload.path);
  });

  app.delete('/:id', { preHandler: [authorize('tenant_admin'), requirePermission('upload:delete')] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const tenantId = request.user!.tenantId!;

    const upload = await prisma.upload.findFirst({
      where: { id, tenantId },
    });

    if (!upload) throw AppError.notFound('UPLOAD_NOT_FOUND', 'Arquivo não encontrado');

    const fs = require('fs');
    if (fs.existsSync(upload.path)) {
      fs.unlinkSync(upload.path);
    }

    await prisma.upload.delete({ where: { id } });

    return { success: true, data: { message: 'Arquivo removido com sucesso' } };
  });
}