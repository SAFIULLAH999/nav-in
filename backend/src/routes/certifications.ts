import { Router } from 'express';
import { body, param } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ============== CERTIFICATIONS ==============

// Create certification
router.post('/certifications',
  body('name').isString().notEmpty(),
  body('issuingOrg').isString().notEmpty(),
  body('issueDate').isISO8601(),
  body('expiryDate').optional().isISO8601(),
  body('credentialId').optional().isString(),
  body('credentialUrl').optional().isURL(),
  body('description').optional().isString(),
  body('media').optional().isString(),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const certificationData = req.body;

      const certification = await prisma.certification.create({
        data: {
          userId,
          ...certificationData
        }
      });

      res.status(201).json(certification);
    } catch (error) {
      console.error('Error creating certification:', error);
      res.status(500).json({ error: 'Failed to create certification' });
    }
  }
);

// Get user's certifications
router.get('/certifications',
  async (req, res) => {
    try {
      const userId = req.user.id;

      const certifications = await prisma.certification.findMany({
        where: { userId },
        orderBy: [
          { isVerified: 'desc' },
          { issueDate: 'desc' }
        ]
      });

      res.json(certifications);
    } catch (error) {
      console.error('Error fetching certifications:', error);
      res.status(500).json({ error: 'Failed to fetch certifications' });
    }
  }
);

// Get specific certification
router.get('/certifications/:id',
  param('id').isString(),
  async (req, res) => {
    try {
      const { id } = req.params;

      const certification = await prisma.certification.findUnique({
        where: { id }
      });

      if (!certification) {
        return res.status(404).json({ error: 'Certification not found' });
      }

      res.json(certification);
    } catch (error) {
      console.error('Error fetching certification:', error);
      res.status(500).json({ error: 'Failed to fetch certification' });
    }
  }
);

// Update certification
router.put('/certifications/:id',
  param('id').isString(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const certification = await prisma.certification.findUnique({
        where: { id }
      });

      if (!certification || certification.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const updated = await prisma.certification.update({
        where: { id },
        data: updateData
      });

      res.json(updated);
    } catch (error) {
      console.error('Error updating certification:', error);
      res.status(500).json({ error: 'Failed to update certification' });
    }
  }
);

// Delete certification
router.delete('/certifications/:id',
  param('id').isString(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const certification = await prisma.certification.findUnique({
        where: { id }
      });

      if (!certification || certification.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await prisma.certification.delete({
        where: { id }
      });

      res.json({ message: 'Certification deleted successfully' });
    } catch (error) {
      console.error('Error deleting certification:', error);
      res.status(500).json({ error: 'Failed to delete certification' });
    }
  }
);

// ============== LICENSES ==============

// Create license
router.post('/licenses',
  body('name').isString().notEmpty(),
  body('issuingAuthority').isString().notEmpty(),
  body('licenseNumber').isString().notEmpty(),
  body('issueDate').isISO8601(),
  body('expiryDate').optional().isISO8601(),
  body('description').optional().isString(),
  body('verificationUrl').optional().isURL(),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const licenseData = req.body;

      // Check if license number already exists for this user
      const existing = await prisma.license.findUnique({
        where: {
          userId_licenseNumber: {
            userId,
            licenseNumber: licenseData.licenseNumber
          }
        }
      });

      if (existing) {
        return res.status(400).json({ error: 'License with this number already exists' });
      }

      const license = await prisma.license.create({
        data: {
          userId,
          ...licenseData
        }
      });

      res.status(201).json(license);
    } catch (error) {
      console.error('Error creating license:', error);
      res.status(500).json({ error: 'Failed to create license' });
    }
  }
);

// Get user's licenses
router.get('/licenses',
  async (req, res) => {
    try {
      const userId = req.user.id;

      const licenses = await prisma.license.findMany({
        where: { userId },
        orderBy: [
          { isActive: 'desc' },
          { issueDate: 'desc' }
        ]
      });

      res.json(licenses);
    } catch (error) {
      console.error('Error fetching licenses:', error);
      res.status(500).json({ error: 'Failed to fetch licenses' });
    }
  }
);

// Update license
router.put('/licenses/:id',
  param('id').isString(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const license = await prisma.license.findUnique({
        where: { id }
      });

      if (!license || license.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const updated = await prisma.license.update({
        where: { id },
        data: updateData
      });

      res.json(updated);
    } catch (error) {
      console.error('Error updating license:', error);
      res.status(500).json({ error: 'Failed to update license' });
    }
  }
);

// Delete license
router.delete('/licenses/:id',
  param('id').isString(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const license = await prisma.license.findUnique({
        where: { id }
      });

      if (!license || license.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await prisma.license.delete({
        where: { id }
      });

      res.json({ message: 'License deleted successfully' });
    } catch (error) {
      console.error('Error deleting license:', error);
      res.status(500).json({ error: 'Failed to delete license' });
    }
  }
);

export default router;
