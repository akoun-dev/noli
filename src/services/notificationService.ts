export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface WhatsAppMessage {
  to: string; // Format international: +225XXXXXXXXX
  message: string;
  mediaUrl?: string;
}

export interface SMSMessage {
  to: string; // Format international: +225XXXXXXXXX
  message: string;
}

export class NotificationService {
  // Email Templates
  static readonly emailTemplates = {
    quoteGenerated: (data: {
      firstName: string;
      quoteId: string;
      price: number;
      insurerName: string;
      downloadUrl: string;
    }): EmailTemplate => ({
      to: '', // Sera rempli par l'appelant
      subject: 'Votre devis d\'assurance NOLI est prêt',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;"> Votre devis est prêt !</h1>
          </div>

          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Bonjour <strong>${data.firstName}</strong>,
            </p>

            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Nous sommes ravis de vous informer que votre devis d'assurance <strong>#${data.quoteId}</strong> a été généré avec succès.
            </p>

            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Détails du devis :</h3>
              <ul style="color: #4b5563; font-size: 14px; line-height: 1.6;">
                <li><strong>Assureur :</strong> ${data.insurerName}</li>
                <li><strong>Prime annuelle :</strong> ${data.price.toLocaleString()} FCFA</li>
                <li><strong>Prime mensuelle :</strong> ${Math.round(data.price / 12).toLocaleString()} FCFA</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.downloadUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                 Télécharger votre devis PDF
              </a>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
              Ce devis est valable pour 30 jours. N'hésitez pas à nous contacter si vous avez des questions.
            </p>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                 +225 07 123 456 78 |  contact@noliassurance.ci<br>
                Abidjan, Côte d'Ivoire | www.noliassurance.ci
              </p>
            </div>
          </div>
        </div>
      `
    }),

    quoteApproved: (data: {
      firstName: string;
      quoteId: string;
      insurerName: string;
      nextSteps: string;
    }): EmailTemplate => ({
      to: '',
      subject: ' Votre devis d\'assurance a été approuvé',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;"> Devis Approuvé</h1>
          </div>

          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Bonjour <strong>${data.firstName}</strong>,
            </p>

            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Excellente nouvelle ! Votre devis <strong>#${data.quoteId}</strong> avec <strong>${data.insurerName}</strong> a été approuvé.
            </p>

            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
              <h3 style="color: #065f46; margin: 0 0 10px 0; font-size: 16px;">Prochaines étapes :</h3>
              <p style="color: #065f46; font-size: 14px; line-height: 1.6; margin: 0;">
                ${data.nextSteps}
              </p>
            </div>

            <p style="font-size: 14px; color: #6b7280;">
              Notre équipe vous contactera prochainement pour finaliser votre contrat.
            </p>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                 +225 07 123 456 78 |  contact@noliassurance.ci
              </p>
            </div>
          </div>
        </div>
      `
    }),

    policyReminder: (data: {
      firstName: string;
      policyNumber: string;
      expiryDate: string;
      renewalUrl: string;
    }): EmailTemplate => ({
      to: '',
      subject: ' Rappel : Votre contrat d\'assurance arrive à expiration',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;"> Rappel de Renouvellement</h1>
          </div>

          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Bonjour <strong>${data.firstName}</strong>,
            </p>

            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Votre contrat d'assurance <strong>#${data.policyNumber}</strong> arrive à expiration le <strong>${data.expiryDate}</strong>.
            </p>

            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
              <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">Important :</h3>
              <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
                Pour éviter toute interruption de couverture, veuillez renouveler votre contrat avant la date d'expiration.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.renewalUrl}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                 Renouveler mon contrat
              </a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                 +225 07 123 456 78 |  contact@noliassurance.ci
              </p>
            </div>
          </div>
        </div>
      `
    })
  };

  // WhatsApp Templates
  static readonly whatsappTemplates = {
    quoteGenerated: (data: {
      firstName: string;
      quoteId: string;
      price: number;
      insurerName: string;
      downloadUrl: string;
    }): WhatsAppMessage => ({
      to: '',
      message: ` Bonjour ${data.firstName}, votre devis #${data.quoteId} est prêt !

Détails :
• Assureur : ${data.insurerName}
• Prime annuelle : ${data.price.toLocaleString()} FCFA
• Prime mensuelle : ${Math.round(data.price / 12).toLocaleString()} FCFA

 Téléchargez votre devis PDF ici :
${data.downloadUrl}

Ce devis est valable 30 jours. Contactez-nous pour toute question !

NOLI Assurance
+225 07 123 456 78`
    }),

    quoteApproved: (data: {
      firstName: string;
      quoteId: string;
      insurerName: string;
    }): WhatsAppMessage => ({
      to: '',
      message: ` Bonjour ${data.firstName}, excellente nouvelle !

Votre devis #${data.quoteId} avec ${data.insurerName} a été APPROUVÉ ! 

Prochaines étapes :
• Notre équipe vous contactera pour finaliser le contrat
• Préparez les documents nécessaires (pièce d'identité, permis, carte grise)

Félicitations !

NOLI Assurance
+225 07 123 456 78`
    }),

    paymentReminder: (data: {
      firstName: string;
      amount: number;
      dueDate: string;
      paymentUrl: string;
    }): WhatsAppMessage => ({
      to: '',
      message: ` Rappel de paiement bonjour ${data.firstName},

Votre paiement de ${data.amount.toLocaleString()} FCFA est dû le ${data.dueDate}.

Effectuez votre paiement ici :
${data.paymentUrl}

Pour éviter toute interruption, veuillez régler avant la date d'échéance.

NOLI Assurance
+225 07 123 456 78`
    })
  };

  // SMS Templates
  static readonly smsTemplates = {
    quoteGenerated: (data: {
      firstName: string;
      quoteId: string;
      price: number;
    }): SMSMessage => ({
      to: '',
      message: `NOLI: Bonjour ${data.firstName}, votre devis #${data.quoteId} de ${data.price.toLocaleString()} FCFA/an est pret. Telechargez le PDF depuis votre espace client. Valide 30j. Tel: +2250712345678`
    }),

    quoteApproved: (data: {
      firstName: string;
      quoteId: string;
    }): SMSMessage => ({
      to: '',
      message: `NOLI: Bonjour ${data.firstName}, votre devis #${data.quoteId} a ete approuve! Notre equipe vous contactera pour finaliser. Tel: +2250712345678`
    }),

    paymentReminder: (data: {
      firstName: string;
      amount: number;
      dueDate: string;
    }): SMSMessage => ({
      to: '',
      message: `NOLI: Bonjour ${data.firstName}, rappel paiement de ${data.amount.toLocaleString()} FCFA due le ${data.dueDate}. Connectez-vous a votre espace client. Tel: +2250712345678`
    })
  };

  // Email Service
  static async sendEmail(template: EmailTemplate): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock email sending - In production, integrate with real email service
    logger.info('📧 Email sent:', {
      to: template.to,
      subject: template.subject,
      preview: template.html.substring(0, 100) + '...'
    });

    // Simulate email service integration
    // In production, use services like:
    // - SendGrid, Mailgun, Amazon SES
    // - Node.js nodemailer with SMTP
    // - Firebase Cloud Functions with email triggers

    return Promise.resolve();
  }

  // WhatsApp Service
  static async sendWhatsApp(message: WhatsAppMessage): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock WhatsApp sending - In production, integrate with WhatsApp Business API
    logger.info('💬 WhatsApp message sent:', {
      to: message.to,
      message: message.message.substring(0, 100) + '...',
      mediaUrl: message.mediaUrl
    });

    // Simulate WhatsApp Business API integration
    // In production, use services like:
    // - WhatsApp Business API
    // - Twilio WhatsApp
    // - MessageBird

    return Promise.resolve();
  }

  // SMS Service
  static async sendSMS(message: SMSMessage): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock SMS sending - In production, integrate with SMS gateway
    logger.info('📱 SMS sent:', {
      to: message.to,
      message: message.message
    });

    // Simulate SMS gateway integration
    // In production, use services like:
    // - Twilio
    // - Vonage (Nexmo)
    // - AWS SNS
    // - Local African SMS providers

    return Promise.resolve();
  }

  // Multi-channel notification sender
  static async sendNotification(
    channels: ('email' | 'whatsapp' | 'sms')[],
    recipient: {
      email: string;
      phone: string; // Format international
    },
    templateType: keyof typeof this.emailTemplates | keyof typeof this.whatsappTemplates | keyof typeof this.smsTemplates,
    templateData: any
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const channel of channels) {
      switch (channel) {
        case 'email':
          if (recipient.email && this.emailTemplates[templateType as keyof typeof this.emailTemplates]) {
            const template = this.emailTemplates[templateType as keyof typeof this.emailTemplates](templateData);
            template.to = recipient.email;
            promises.push(this.sendEmail(template));
          }
          break;

        case 'whatsapp':
          if (recipient.phone && this.whatsappTemplates[templateType as keyof typeof this.whatsappTemplates]) {
            const message = this.whatsappTemplates[templateType as keyof typeof this.whatsappTemplates](templateData);
            message.to = recipient.phone;
            promises.push(this.sendWhatsApp(message));
          }
          break;

        case 'sms':
          if (recipient.phone && this.smsTemplates[templateType as keyof typeof this.smsTemplates]) {
            const message = this.smsTemplates[templateType as keyof typeof this.smsTemplates](templateData);
            message.to = recipient.phone;
            promises.push(this.sendSMS(message));
          }
          break;
      }
    }

    try {
      await Promise.all(promises);
      logger.info(`Notifications sent via ${channels.join(', ')} to ${recipient.email || recipient.phone}`);
    } catch (error) {
      logger.error('Error sending notifications:', error);
      throw new Error('Erreur lors de l\'envoi des notifications');
    }
  }

  // Bulk notification sender
  static async sendBulkNotifications(
    recipients: Array<{
      email: string;
      phone: string;
      data: any;
    }>,
    channels: ('email' | 'whatsapp' | 'sms')[],
    templateType: keyof typeof this.emailTemplates | keyof typeof this.whatsappTemplates | keyof typeof this.smsTemplates
  ): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
      recipients.map(recipient =>
        this.sendNotification(channels, recipient, templateType, recipient.data)
      )
    );

    const success = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    logger.info(`📊 Bulk notification results: ${success} sent, ${failed} failed`);
    return { success, failed };
  }
}

// Export instance for use throughout the application
export const notificationService = NotificationService;