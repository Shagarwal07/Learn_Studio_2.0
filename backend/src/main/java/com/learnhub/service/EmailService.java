package com.learnhub.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${brevo.api-key:}")
    private String brevoApiKey;

    @Value("${brevo.from-email:rk.coachings20@gmail.com}")
    private String brevoFromEmail;

    @Value("${brevo.from-name:RK COACHING CLASSES}")
    private String brevoFromName;

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${resend.from-email:RK COACHING CLASSES <support@rkcoachingclassesbalotra.work.gd>}")
    private String resendFromEmail;

    private static final int MAX_EMAILS_PER_24_HOURS = 6;
    private static final long TIME_WINDOW_MS = 24 * 60 * 60 * 1000L; // 24 hours in milliseconds
    private final java.util.concurrent.ConcurrentHashMap<String, java.util.List<Long>> emailRateTracker = new java.util.concurrent.ConcurrentHashMap<>();

    private synchronized boolean checkAndRegisterEmailLimit(String toEmail) {
        if (toEmail == null || toEmail.isBlank()) return false;
        String key = toEmail.trim().toLowerCase();
        long now = System.currentTimeMillis();

        java.util.List<Long> timestamps = emailRateTracker.computeIfAbsent(key, k -> new java.util.ArrayList<>());
        timestamps.removeIf(t -> (now - t) > TIME_WINDOW_MS);

        if (timestamps.size() >= MAX_EMAILS_PER_24_HOURS) {
            log.warn("Rate limit reached for {}: Already sent {} emails in the last 24h. Skipping email.", key, MAX_EMAILS_PER_24_HOURS);
            return false;
        }

        timestamps.add(now);
        return true;
    }

    private void sendEmailInternal(String toEmail, String subject, String htmlContent) {
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();

        // 1. Try Brevo HTTP API (Sendinblue)
        if (brevoApiKey != null && !brevoApiKey.isBlank() && brevoApiKey.trim().startsWith("xkeysib-")) {
            try {
                java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();

                String jsonPayload = String.format(
                    "{\"sender\":{\"name\":%s,\"email\":%s},\"to\":[{\"email\":%s}],\"subject\":%s,\"htmlContent\":%s}",
                    mapper.writeValueAsString(brevoFromName),
                    mapper.writeValueAsString(brevoFromEmail),
                    mapper.writeValueAsString(toEmail),
                    mapper.writeValueAsString(subject),
                    mapper.writeValueAsString(htmlContent)
                );

                java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("api-key", brevoApiKey.trim())
                    .header("Content-Type", "application/json")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

                java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    log.info("Brevo email dispatched successfully to {}. Subject: {}", toEmail, subject);
                    return;
                } else {
                    log.error("Brevo API error for {}. Status Code: {}, Body: {}", toEmail, response.statusCode(), response.body());
                }
            } catch (Exception e) {
                log.error("Failed to send email via Brevo to {}: {}", toEmail, e.getMessage());
            }
        }

        // 2. Try Resend HTTP API
        if (resendApiKey != null && !resendApiKey.isBlank() && resendApiKey.trim().startsWith("re_")) {
            try {
                java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();

                String jsonPayload = String.format(
                    "{\"from\":\"%s\",\"to\":[\"%s\"],\"subject\":%s,\"html\":%s}",
                    resendFromEmail,
                    toEmail,
                    mapper.writeValueAsString(subject),
                    mapper.writeValueAsString(htmlContent)
                );

                java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey.trim())
                    .header("Content-Type", "application/json")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

                java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    log.info("Resend email dispatched successfully to {}. Subject: {}", toEmail, subject);
                    return;
                } else {
                    log.error("Resend API error for {}. Status Code: {}, Body: {}", toEmail, response.statusCode(), response.body());
                }
            } catch (Exception e) {
                log.error("Failed to send email via Resend to {}: {}", toEmail, e.getMessage());
            }
        }

        // 3. Fallback to Spring Mail SMTP
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
            log.info("Email sent via SMTP fallback to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send email via SMTP fallback to {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * Sends a simple text announcement to a student asynchronously.
     * @deprecated Use sendHtmlAnnouncement instead.
     */
    @Async
    @Deprecated
    public void sendAnnouncement(String toEmail, String subject, String message) {
        if (!checkAndRegisterEmailLimit(toEmail)) {
            return;
        }
        sendEmailInternal(toEmail, subject, "<p>" + message + "</p>");
    }

    /**
     * Sends a beautifully styled Gen Z HTML announcement email.
     */
    @Async
    public void sendHtmlAnnouncement(String toEmail, String studentName, String instructorName, String batchName, com.learnhub.entity.Announcement ann) {
        if (!checkAndRegisterEmailLimit(toEmail)) {
            return;
        }
        try {
            Context thymeleafContext = new Context();
            thymeleafContext.setVariable("studentName", studentName);
            thymeleafContext.setVariable("instructorName", instructorName);
            thymeleafContext.setVariable("batchName", batchName);
            thymeleafContext.setVariable("announcementTitle", ann.getTitle());
            thymeleafContext.setVariable("message", ann.getMessage());
            thymeleafContext.setVariable("imageUrl", ann.getImageUrl());
            thymeleafContext.setVariable("externalLink", ann.getExternalLink());
            thymeleafContext.setVariable("instagramUrl", ann.getInstagramUrl());

            String htmlBody = templateEngine.process("announcement-email", thymeleafContext);
            sendEmailInternal(toEmail, "🚨 " + ann.getTitle(), htmlBody);
        } catch (Exception e) {
            log.error("Failed to send HTML Announcement to {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * Sends a schedule event notification email to a student.
     */
    @Async
    public void sendScheduleNotification(String toEmail, String studentName, String title, String eventType, String dateStr, String timeStr, String locationOrLink, String batchOrCourseName) {
        if (!checkAndRegisterEmailLimit(toEmail)) {
            return;
        }
        try {
            Context thymeleafContext = new Context();
            thymeleafContext.setVariable("studentName", studentName);
            thymeleafContext.setVariable("eventTitle", title);
            thymeleafContext.setVariable("eventType", eventType);
            thymeleafContext.setVariable("eventDate", dateStr);
            thymeleafContext.setVariable("eventTime", timeStr);
            thymeleafContext.setVariable("locationOrLink", locationOrLink);
            thymeleafContext.setVariable("meetingLink", locationOrLink != null && locationOrLink.startsWith("http") ? locationOrLink : null);
            thymeleafContext.setVariable("batchName", batchOrCourseName != null ? batchOrCourseName : "All Students");

            String htmlBody = templateEngine.process("schedule-email", thymeleafContext);
            sendEmailInternal(toEmail, "🗓️ New Schedule Alert: " + title, htmlBody);
        } catch (Exception e) {
            log.error("Failed to send schedule notification to {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * Dynamically generates an HTML report card using Thymeleaf and sends it asynchronously.
     */
    @Async
    public void sendReportCard(String toEmail, String studentName, String batchName, Map<String, Object> templateModel) {
        if (!checkAndRegisterEmailLimit(toEmail)) {
            return;
        }
        try {
            Context thymeleafContext = new Context();
            thymeleafContext.setVariables(templateModel);
            thymeleafContext.setVariable("studentName", studentName);
            thymeleafContext.setVariable("courseName", batchName);

            String htmlBody = templateEngine.process("report-card", thymeleafContext);
            sendEmailInternal(toEmail, "Your Report Card for " + batchName, htmlBody);
        } catch (Exception e) {
            log.error("Failed to send Report Card to {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * Sends a beautiful customized Welcome Email with confidential Student Credentials.
     */
    @Async
    public void sendStudentWelcomeCredentials(String toEmail, String studentName, String userEmail, String plainPassword, String batchName) {
        if (!checkAndRegisterEmailLimit(toEmail)) {
            log.warn("Rate limit reached for {}. Skipping welcome credential email.", toEmail);
            return;
        }
        try {
            String websiteUrl = "https://learn-studio-2-0.vercel.ap            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        @media only screen and (max-width: 480px) {
                            .outer-padding { padding: 10px 6px !important; }
                            .card-padding { padding: 22px 14px !important; border-radius: 18px !important; }
                            .welcome-title { font-size: 20px !important; letter-spacing: 4px !important; }
                            .cta-btn { display: block !important; width: 100%% !important; box-sizing: border-box !important; padding: 14px 12px !important; font-size: 13px !important; }
                        }
                    </style>
                </head>
                <body style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 0; width: 100%%; -webkit-text-size-adjust: 100%%; -ms-text-size-adjust: 100%%;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; width: 100%%; margin: 0; padding: 20px 0;">
                        <tr>
                            <td align="center" class="outer-padding" style="padding: 15px 10px;">
                                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%%; background: #ffffff; border-radius: 24px; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.07); border: 1px solid #cbd5e1; border-top: 6px solid #2563eb;" class="card-padding">
                                    <tr>
                                        <td style="padding: 28px 22px;">
                                            
                                            <!-- Memphis Corner Blobs Header (Gmail Mobile Compatible) -->
                                            <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 15px;">
                                                <tr>
                                                    <td align="left" valign="top">
                                                        <span style="display: inline-block; width: 32px; height: 32px; background-color: #ff4d4d; border-radius: 50%%; margin-right: -8px; vertical-align: middle;"></span>
                                                        <span style="display: inline-block; width: 42px; height: 42px; background-color: #facc15; border-radius: 50%%; vertical-align: middle;"></span>
                                                    </td>
                                                    <td align="right" valign="top">
                                                        <span style="display: inline-block; width: 42px; height: 42px; background-color: #10b981; border-radius: 50%%; vertical-align: middle; margin-right: -8px;"></span>
                                                        <span style="display: inline-block; width: 32px; height: 32px; background-color: #2563eb; border-radius: 50%%; vertical-align: middle;"></span>
                                                    </td>
                                                </tr>
                                            </table>

                                            <div style="text-align: center; margin-bottom: 22px; padding-top: 5px;">
                                                <h1 class="welcome-title" style="font-size: 24px; font-weight: 900; letter-spacing: 6px; color: #0f172a; text-transform: uppercase; margin: 0; font-family: Georgia, 'Times New Roman', serif;">W E L C O M E</h1>
                                                <div style="font-size: 15px; font-weight: 800; color: #334155; margin-top: 6px;">Rk Coaching Classes.</div>
                                                <div style="width: 50px; height: 4px; background: #2563eb; margin: 14px auto 20px auto; border-radius: 10px;"></div>
                                            </div>
                                            
                                            <div>
                                                <div style="font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 14px;">Dear / प्रिय %s 👋</div>
                                                
                                                <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 16px 16px; border-radius: 0 12px 12px 0; margin-bottom: 18px;">
                                                    <div style="font-size: 13px; line-height: 1.6; color: #334155; margin-bottom: 8px; font-weight: 600;">
                                                        We are excited to share that <strong>RK COACHING CLASSES</strong> has launched its official Digital Student Portal on <strong>LearnStudio 2.0</strong>! 🚀
                                                    </div>
                                                    <div style="font-size: 13px; line-height: 1.6; color: #475569; font-weight: 500;">
                                                        आर.के. कोचिंग क्लासेस (<strong>RK COACHING CLASSES</strong>) का नया आधिकारिक डिजिटल स्टूडेंट पोर्टल (<strong>LearnStudio 2.0</strong>) अब लाइव हो चुका है! 🚀
                                                    </div>
                                                </div>

                                                <div style="background: #f8fafc; border-left: 4px solid #facc15; padding: 16px 16px; border-radius: 0 12px 12px 0; margin-bottom: 18px;">
                                                    <div style="font-size: 13px; line-height: 1.6; color: #334155; margin-bottom: 8px; font-weight: 600;">
                                                        A heartfelt thank you to all active students of <strong>%s</strong>! Your dedication and hard work drive our academic mission forward every single day. ❤️
                                                    </div>
                                                    <div style="font-size: 13px; line-height: 1.6; color: #475569; font-weight: 500;">
                                                        <strong>%s</strong> के हमारे सभी एक्टिव और होनहार विद्यार्थियों का आर.के. कोचिंग परिवार की तरफ से सहृदय धन्यवाद! आपकी मेहनत और लगन ही हमारी सबसे बड़ी ताकत है। ❤️
                                                    </div>
                                                </div>

                                                <div style="background: #ffffff; border: 2px solid #e2e8f0; border-radius: 16px; padding: 18px 16px; margin: 20px 0; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.03);">
                                                    <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #2563eb; letter-spacing: 1.5px; margin-bottom: 14px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">🔒 YOUR CONFIDENTIAL LOGIN CREDENTIALS / आपकी गोपनीय लॉगिन जानकारी</div>
                                                    
                                                    <div style="margin-bottom: 12px;">
                                                        <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">🌐 Official Website Link / पोर्टल लिंक</div>
                                                        <div style="font-size: 13px; font-weight: 800; color: #0f172a; background: #f1f5f9; padding: 10px 12px; border-radius: 10px; font-family: monospace; display: block; word-break: break-all; overflow-wrap: anywhere;"><a href="%s" style="color: #2563eb; text-decoration: none;">%s</a></div>
                                                    </div>
                                                    
                                                    <div style="margin-bottom: 12px;">
                                                        <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">👤 User ID (Email) / यूजर आईडी (ईमेल)</div>
                                                        <div style="font-size: 13px; font-weight: 800; color: #0284c7; background: #f1f5f9; padding: 10px 12px; border-radius: 10px; font-family: monospace; display: block; word-break: break-all; overflow-wrap: anywhere;">%s</div>
                                                    </div>

                                                    <div style="margin-bottom: 12px;">
                                                        <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">🔑 Password / पासवर्ड</div>
                                                        <div style="font-size: 13px; font-weight: 800; color: #dc2626; background: #f1f5f9; padding: 10px 12px; border-radius: 10px; font-family: monospace; display: block; word-break: break-all; overflow-wrap: anywhere;">%s</div>
                                                    </div>

                                                    <div style="margin-top: 12px; padding: 10px 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; font-size: 11px; color: #1e40af; font-weight: 600; line-height: 1.5;">
                                                        💡 <strong>GOOGLE SIGN-IN:</strong> You can also log in directly using your registered Google Email!<br>
                                                        💡 <strong>गूगल लॉगिन:</strong> आप अपने पंजीकृत गूगल ईमेल (Google Sign-In) का उपयोग करके भी सीधे लॉगिन कर सकते हैं।
                                                    </div>
                                                </div>

                                                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 12px 14px; text-align: center; margin-top: 18px;">
                                                    <p style="margin: 0; font-size: 11px; color: #991b1b; font-weight: 600; line-height: 1.5;">🔒 <strong>CONFIDENTIAL & PRIVATE:</strong> These credentials belong strictly to you. Do NOT share your login details with anyone.<br>
                                                    <strong>गोपनीय सूचना:</strong> यह पासवर्ड केवल आपके व्यक्तिगत उपयोग के लिए है। सुरक्षा के दृष्टिकोण से इसे किसी के साथ साझा न करें।</p>
                                                </div>

                                                <div style="text-align: center; margin: 24px 0 10px 0;">
                                                    <a href="%s" class="cta-btn" style="background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 50px; font-weight: 800; font-size: 13px; display: inline-block; box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3); letter-spacing: 0.5px;">🚀 LOGIN TO STUDENT PORTAL</a>
                                                </div>
                                            </div>

                                            <!-- Bottom Memphis Corner Blobs -->
                                            <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 20px;">
                                                <tr>
                                                    <td align="left" valign="bottom">
                                                        <span style="display: inline-block; width: 32px; height: 32px; background-color: #2563eb; border-radius: 50%%; margin-right: -8px; vertical-align: middle;"></span>
                                                        <span style="display: inline-block; width: 42px; height: 42px; background-color: #10b981; border-radius: 50%%; vertical-align: middle;"></span>
                                                    </td>
                                                    <td align="right" valign="bottom">
                                                        <span style="display: inline-block; width: 42px; height: 42px; background-color: #facc15; border-radius: 50%%; vertical-align: middle; margin-right: -8px;"></span>
                                                        <span style="display: inline-block; width: 32px; height: 32px; background-color: #ff4d4d; border-radius: 50%%; vertical-align: middle;"></span>
                                                    </td>
                                                </tr>
                                            </table>

                                            <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                                                <div style="font-size: 11px; font-weight: 800; color: #475569; letter-spacing: 0.5px;">RK COACHING CLASSES • Powered by LearnStudio 2.0</div>
                                                <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Academic Excellence & Digital Innovation • किसी भी सहायता के लिए संस्थान से संपर्क करें।</div>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            """.formatted(studentName, batchName != null ? batchName : "Class Batch", batchName != null ? batchName : "आपकी क्लास", websiteUrl, websiteUrl, userEmail, plainPassword, websiteUrl);

            sendEmailInternal(toEmail, "🎉 Welcome to RK COACHING CLASSES Digital Portal - Your Login Credentials", htmlContent);
        } catch (Exception e) {
            log.error("Failed to send welcome credentials email to {}: {}", toEmail, e.getMessage());
        }
    }
}
