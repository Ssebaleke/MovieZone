import express from 'express';
import prisma from '../db.js';

const router = express.Router();

/**
 * GET /api/settings/public
 * Returns public system settings for client apps (e.g. WhatsApp support number, message, enabled flag)
 */
router.get('/public', async (req, res) => {
  try {
    const keys = ['SUPPORT_WHATSAPP_NUMBER', 'SUPPORT_WHATSAPP_MESSAGE', 'SUPPORT_WHATSAPP_ENABLED'];
    
    let dbSettings = [];
    if (prisma.systemSetting) {
      dbSettings = await prisma.systemSetting.findMany({
        where: {
          key: { in: keys }
        }
      });
    }

    const settingsObj = {
      SUPPORT_WHATSAPP_NUMBER: '256770000000',
      SUPPORT_WHATSAPP_MESSAGE: 'Hello! I need assistance with MovieZone.',
      SUPPORT_WHATSAPP_ENABLED: 'true'
    };

    dbSettings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    res.json(settingsObj);
  } catch (error) {
    console.error('Error fetching public system settings:', error);
    res.json({
      SUPPORT_WHATSAPP_NUMBER: '',
      SUPPORT_WHATSAPP_MESSAGE: 'Hello! I need assistance with MovieZone.',
      SUPPORT_WHATSAPP_ENABLED: 'false'
    });
  }
});

export default router;
