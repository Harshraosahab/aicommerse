import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { CommunicationLog } from '../models/communicationLog.model.js';
import { escapeHtml } from '../utils/htmlSanitizer.js';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  userId?: string;
  type?: string;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
      this.isConfigured = true;
      logger.info('Email service initialized with SMTP transport.');
    } else {
      this.isConfigured = false;
      logger.warn('Email service: SMTP credentials not provided. Simulating email logging.');
    }
  }

  /**
   * Send an email with retry logic and audit logging in CommunicationLog.
   * If idempotencyKey is supplied and already recorded as SENT or DELIVERED, dispatches are skipped.
   */
  async sendEmail(options: SendEmailOptions): Promise<{ sent: boolean; messageId?: string; simulated?: boolean }> {
    const { to, subject, text, html, userId, type = 'GENERAL', idempotencyKey, metadata = {} } = options;

    if (idempotencyKey) {
      const existing = await CommunicationLog.findOne({
        idempotencyKey,
        status: { $in: ['SENT', 'DELIVERED'] },
      });
      if (existing) {
        logger.info(`[EMAIL DUPLICATE SUPPRESSED] IdempotencyKey: ${idempotencyKey} | To: ${to}`);
        return { sent: true, messageId: existing._id.toString() };
      }
    }

    if (!this.isConfigured || !this.transporter) {
      logger.info(`[EMAIL SIMULATED - UNCONFIGURED SMTP] To: ${to} | Subject: ${subject}`);
      try {
        await CommunicationLog.create({
          user: userId || null,
          channel: 'EMAIL',
          recipient: to,
          type,
          subject,
          status: 'SENT',
          retryCount: 0,
          idempotencyKey,
          metadata: { ...metadata, simulated: true },
        });
      } catch (err: any) {
        // Unique key violation or other benign DB logging error
        logger.warn(`Failed to log simulated email communication: ${err.message}`);
      }
      return { sent: true, simulated: true };
    }

    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const info = await this.transporter.sendMail({
          from: env.EMAIL_FROM,
          to,
          subject,
          text,
          html,
        });

        logger.info(`Email sent: ${info.messageId} to ${to} (Attempt ${attempt})`);

        await CommunicationLog.create({
          user: userId || null,
          channel: 'EMAIL',
          recipient: to,
          type,
          subject,
          status: 'DELIVERED',
          retryCount: attempt - 1,
          idempotencyKey,
          metadata: { ...metadata, messageId: info.messageId },
        });

        return { sent: true, messageId: info.messageId };
      } catch (error: any) {
        lastError = error;
        logger.warn(`Email attempt ${attempt} failed for ${to}: ${error.message}`);
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 200));
        }
      }
    }

    // All retries failed
    logger.error(`All ${maxRetries} email attempts failed for ${to}:`, lastError);
    try {
      await CommunicationLog.create({
        user: userId || null,
        channel: 'EMAIL',
        recipient: to,
        type,
        subject,
        status: 'FAILED',
        retryCount: maxRetries,
        failureReason: lastError?.message || 'Delivery failed',
        idempotencyKey,
        metadata,
      });
    } catch (logErr: any) {
      logger.warn(`Failed to log email failure to CommunicationLog: ${logErr.message}`);
    }

    return { sent: false };
  }

  // ---- Transactional Email Templates with HTML Escaping ----

  async sendPasswordResetEmail(to: string, resetToken: string, userId?: string): Promise<void> {
    const resetUrl = `${env.CORS_ORIGIN}/reset-password/${encodeURIComponent(resetToken)}`;
    const subject = 'Password Reset Request';
    const text = `You requested a password reset. Please use the following link to reset your password within 1 hour:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #1f2937;">Password Reset Request</h2>
        <p style="color: #4b5563; font-size: 15px;">You requested a password reset for your account. Click the button below to reset your password (valid for 1 hour):</p>
        <p style="margin: 24px 0;">
          <a href="${escapeHtml(resetUrl)}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p style="color: #6b7280; font-size: 13px;">Or paste this link into your browser: <br/><a href="${escapeHtml(resetUrl)}" style="color: #2563eb;">${escapeHtml(resetUrl)}</a></p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 12px;">If you did not make this request, you can safely ignore this email.</p>
      </div>
    `;

    await this.sendEmail({ to, subject, text, html, userId, type: 'PASSWORD_RESET' });
  }

  async sendVerificationEmail(to: string, token: string, userId?: string): Promise<void> {
    const verifyUrl = `${env.CORS_ORIGIN}/verify-email/${encodeURIComponent(token)}`;
    const subject = 'Verify your email address';
    const text = `Thank you for registering. Please verify your email by clicking: ${verifyUrl}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #1f2937;">Welcome to Our Store!</h2>
        <p style="color: #4b5563; font-size: 15px;">Please verify your email address to complete your registration and activate your account:</p>
        <p style="margin: 24px 0;">
          <a href="${escapeHtml(verifyUrl)}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Verify Email
          </a>
        </p>
        <p style="color: #6b7280; font-size: 13px;">Or paste this link into your browser: <br/><a href="${escapeHtml(verifyUrl)}" style="color: #10b981;">${escapeHtml(verifyUrl)}</a></p>
      </div>
    `;

    await this.sendEmail({ to, subject, text, html, userId, type: 'EMAIL_VERIFICATION' });
  }

  async sendOrderConfirmationEmail(
    to: string,
    order: {
      orderNumber: string;
      total: number;
      currency?: string;
      items: Array<{ title: string; quantity: number; price: number }>;
      shippingAddress?: { street: string; city: string; state: string; postalCode: string; country: string };
    },
    userId?: string
  ): Promise<void> {
    const currency = order.currency || '$';
    const subject = `Order Confirmed - #${order.orderNumber}`;
    const itemsListText = order.items.map((i) => `- ${i.title} x${i.quantity}: ${currency}${i.price.toFixed(2)}`).join('\n');
    const text = `Thank you for your order #${order.orderNumber}!\nTotal: ${currency}${order.total.toFixed(2)}\n\nItems:\n${itemsListText}\n\nWe will notify you when your order ships.`;

    const itemsHtml = order.items
      .map(
        (i) => `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 10px 0; color: #374151;">${escapeHtml(i.title)}</td>
          <td style="padding: 10px 0; text-align: center; color: #6b7280;">${escapeHtml(i.quantity)}</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 500; color: #111827;">${escapeHtml(currency)}${escapeHtml(i.price.toFixed(2))}</td>
        </tr>`
      )
      .join('');

    const addressHtml = order.shippingAddress
      ? `<div style="background-color: #f9fafb; padding: 12px; border-radius: 6px; margin: 16px 0; font-size: 14px; color: #4b5563;">
           <strong>Shipping to:</strong><br/>
           ${escapeHtml(order.shippingAddress.street)}<br/>
           ${escapeHtml(order.shippingAddress.city)}, ${escapeHtml(order.shippingAddress.state)} ${escapeHtml(order.shippingAddress.postalCode)}<br/>
           ${escapeHtml(order.shippingAddress.country)}
         </div>`
      : '';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #111827; margin-top: 0;">Order Confirmation</h2>
        <p style="color: #4b5563; font-size: 15px;">Thank you for shopping with us! Your order <strong>#${escapeHtml(order.orderNumber)}</strong> has been confirmed.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="border-bottom: 2px solid #e5e7eb; text-align: left; font-size: 13px; color: #6b7280; text-transform: uppercase;">
              <th style="padding-bottom: 8px;">Item</th>
              <th style="padding-bottom: 8px; text-align: center;">Qty</th>
              <th style="padding-bottom: 8px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div style="text-align: right; font-size: 18px; font-weight: bold; color: #111827; margin-top: 12px;">
          Total: ${escapeHtml(currency)}${escapeHtml(order.total.toFixed(2))}
        </div>
        ${addressHtml}
        <div style="margin-top: 24px; text-align: center;">
          <a href="${escapeHtml(env.CORS_ORIGIN)}/orders/${escapeHtml(order.orderNumber)}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block;">
            View Order Status
          </a>
        </div>
      </div>
    `;

    await this.sendEmail({
      to,
      subject,
      text,
      html,
      userId,
      type: 'ORDER_CONFIRMATION',
      idempotencyKey: `ORDER_CONFIRM_${order.orderNumber}`,
      metadata: { orderNumber: order.orderNumber, total: order.total },
    });
  }

  async sendShippingUpdateEmail(
    to: string,
    order: {
      orderNumber: string;
      carrier?: string;
      trackingNumber?: string;
      trackingUrl?: string;
      estimatedDeliveryDate?: Date | string;
    },
    userId?: string
  ): Promise<void> {
    const subject = `Your Order #${order.orderNumber} Has Shipped!`;
    const trackingInfo = order.trackingNumber
      ? `Tracking Number: ${order.trackingNumber}${order.carrier ? ` (${order.carrier})` : ''}`
      : 'Your tracking details will update shortly.';
    const text = `Great news! Your order #${order.orderNumber} is on its way.\n${trackingInfo}\n\nTrack your delivery: ${order.trackingUrl || `${env.CORS_ORIGIN}/orders/${order.orderNumber}`}`;

    const trackingButton = order.trackingUrl
      ? `<a href="${escapeHtml(order.trackingUrl)}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Track Package</a>`
      : `<a href="${escapeHtml(env.CORS_ORIGIN)}/orders/${escapeHtml(order.orderNumber)}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Order Tracking</a>`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #111827; margin-top: 0;">Your Package is on the Way! 🚚</h2>
        <p style="color: #4b5563; font-size: 15px;">Order <strong>#${escapeHtml(order.orderNumber)}</strong> has shipped.</p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #166534; font-weight: 500;">
            Carrier: ${escapeHtml(order.carrier || 'Standard Shipping')}<br/>
            ${order.trackingNumber ? `Tracking Number: <strong>${escapeHtml(order.trackingNumber)}</strong><br/>` : ''}
            ${order.estimatedDeliveryDate ? `Estimated Delivery: <strong>${escapeHtml(new Date(order.estimatedDeliveryDate).toLocaleDateString())}</strong>` : ''}
          </p>
        </div>
        <p style="margin: 24px 0; text-align: center;">
          ${trackingButton}
        </p>
      </div>
    `;

    await this.sendEmail({
      to,
      subject,
      text,
      html,
      userId,
      type: 'ORDER_SHIPPED',
      idempotencyKey: `ORDER_SHIPPED_${order.orderNumber}_${order.trackingNumber || 'NOTRACK'}`,
      metadata: { orderNumber: order.orderNumber, carrier: order.carrier, trackingNumber: order.trackingNumber },
    });
  }

  async sendSupportReplyEmail(
    to: string,
    ticket: {
      ticketNumber: string;
      subject: string;
      replyMessage: string;
      repliedBy: string;
    },
    userId?: string
  ): Promise<void> {
    const subject = `Update on Support Ticket #${ticket.ticketNumber}: ${ticket.subject}`;
    const text = `Hello,\n\nA support agent (${ticket.repliedBy}) has replied to your ticket #${ticket.ticketNumber}:\n\n"${ticket.replyMessage}"\n\nLog in to reply: ${env.CORS_ORIGIN}/support/tickets/${ticket.ticketNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #111827; margin-top: 0;">Support Ticket Update</h2>
        <p style="color: #4b5563; font-size: 15px;">There is a new reply on your ticket <strong>#${escapeHtml(ticket.ticketNumber)}</strong>:</p>
        <blockquote style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0; font-size: 14px; color: #374151; white-space: pre-wrap;">
          <strong>${escapeHtml(ticket.repliedBy)}:</strong><br/>
          ${escapeHtml(ticket.replyMessage)}
        </blockquote>
        <p style="margin: 24px 0; text-align: center;">
          <a href="${escapeHtml(env.CORS_ORIGIN)}/support/tickets/${escapeHtml(ticket.ticketNumber)}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View Ticket & Reply
          </a>
        </p>
      </div>
    `;

    await this.sendEmail({
      to,
      subject,
      text,
      html,
      userId,
      type: 'SUPPORT_REPLY',
      metadata: { ticketNumber: ticket.ticketNumber },
    });
  }

  async sendAbandonedCartEmail(
    to: string,
    cartDetails: {
      userName?: string;
      itemCount: number;
      items: Array<{ title: string; price: number; quantity: number }>;
      cartUrl: string;
    },
    userId?: string
  ): Promise<void> {
    const subject = 'You left something behind! Complete your order';
    const text = `Hi ${cartDetails.userName || 'there'},\nYou have ${cartDetails.itemCount} items waiting in your cart. Return to complete your order: ${cartDetails.cartUrl}`;

    const itemsHtml = cartDetails.items
      .slice(0, 3)
      .map(
        (item) => `
        <div style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between;">
          <span style="color: #374151;">${escapeHtml(item.title)} (x${escapeHtml(item.quantity)})</span>
          <span style="font-weight: 500; color: #111827;">$${escapeHtml(item.price.toFixed(2))}</span>
        </div>`
      )
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #111827; margin-top: 0;">Still Thinking About It?</h2>
        <p style="color: #4b5563; font-size: 15px;">Hi ${escapeHtml(cartDetails.userName || 'there')}, you left ${escapeHtml(cartDetails.itemCount)} items in your shopping bag. They're popular and might sell out soon!</p>
        <div style="margin: 16px 0;">
          ${itemsHtml}
        </div>
        <p style="margin: 24px 0; text-align: center;">
          <a href="${escapeHtml(cartDetails.cartUrl)}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Return to Cart
          </a>
        </p>
      </div>
    `;

    await this.sendEmail({
      to,
      subject,
      text,
      html,
      userId,
      type: 'ABANDONED_CART_REMINDER',
      idempotencyKey: `ABANDONED_CART_${userId || to}_${new Date().toISOString().slice(0, 10)}`,
      metadata: { itemCount: cartDetails.itemCount },
    });
  }
}

export const emailService = new EmailService();
