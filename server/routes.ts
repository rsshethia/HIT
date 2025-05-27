import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

const feedbackSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  category: z.enum(['bug', 'feature', 'improvement', 'question', 'other']),
  subject: z.string().min(5),
  message: z.string().min(10),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Feedback submission endpoint
  app.post('/api/feedback', async (req, res) => {
    try {
      // Validate the request body
      const validatedData = feedbackSchema.parse(req.body);
      
      // Check if SendGrid API key is available
      if (!process.env.SENDGRID_API_KEY) {
        return res.status(500).json({ 
          error: 'Email service not configured. Please contact support.' 
        });
      }

      // Import SendGrid
      const sgMail = await import('@sendgrid/mail');
      sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);

      // Create email content
      const emailContent = `
New feedback received from HIT (Health Integration Tools):

Name: ${validatedData.name}
Email: ${validatedData.email}
Category: ${validatedData.category}
Subject: ${validatedData.subject}

Message:
${validatedData.message}

---
Sent from Health Integration Tools (HIT)
Timestamp: ${new Date().toISOString()}
      `;

      const msg = {
        to: 'rushabh.shethia@outlook.com', // Your email address (kept private on server)
        from: 'noreply@hit-tools.com', // This would be your verified sender
        subject: `HIT Feedback: ${validatedData.category.toUpperCase()} - ${validatedData.subject}`,
        text: emailContent,
        replyTo: validatedData.email, // Allow you to reply directly to the user
      };

      // Send email
      await sgMail.default.send(msg);
      
      res.status(200).json({ 
        success: true, 
        message: 'Feedback sent successfully' 
      });

    } catch (error) {
      console.error('Feedback submission error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid form data', 
          details: error.errors 
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to send feedback. Please try again later.' 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
