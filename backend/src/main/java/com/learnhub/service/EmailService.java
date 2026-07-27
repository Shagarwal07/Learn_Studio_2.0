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
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(fromEmail);
            mailMessage.setTo(toEmail);
            mailMessage.setSubject(subject);
            mailMessage.setText(message);

            mailSender.send(mailMessage);
            log.info("Announcement email successfully sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send announcement to {}: {}", toEmail, e.getMessage());
        }
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
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

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

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("🚨 " + ann.getTitle());
            helper.setText(htmlBody, true);

            mailSender.send(mimeMessage);
            log.info("Gen Z HTML Announcement successfully sent to {}", toEmail);
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
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

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

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("🗓️ New Schedule Alert: " + title);
            helper.setText(htmlBody, true);

            mailSender.send(mimeMessage);
            log.info("Schedule notification email successfully sent to {}", toEmail);
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
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            // 1. Prepare Thymeleaf Context with student data
            Context thymeleafContext = new Context();
            thymeleafContext.setVariables(templateModel);
            thymeleafContext.setVariable("studentName", studentName);
            thymeleafContext.setVariable("courseName", batchName); // keeping template variable as courseName for HTML mapping, but it contains batchName

            // 2. Process the HTML template
            String htmlBody = templateEngine.process("report-card", thymeleafContext);

            // 3. Configure and send the email
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Your Report Card for " + batchName);
            helper.setText(htmlBody, true); // true indicates this is an HTML email

            // 4. Attach the logo & charlie inline
            try {
                // Tries to load logo.png from src/main/resources/static/images/
                org.springframework.core.io.ClassPathResource imgFile = new org.springframework.core.io.ClassPathResource("static/images/logo.png");
                if (imgFile.exists()) {
                    helper.addInline("logoImage", imgFile);
                } else {
                    // Fallback to the root LOGO.png if the static one isn't found
                    org.springframework.core.io.FileSystemResource rootImgFile = new org.springframework.core.io.FileSystemResource(new java.io.File("LOGO.png"));
                    if (rootImgFile.exists()) {
                        helper.addInline("logoImage", rootImgFile);
                    }
                }

                // Attach Charlie Instructor Image inline
                org.springframework.core.io.ClassPathResource charlieImgFile = new org.springframework.core.io.ClassPathResource("static/images/charlie-ai.png");
                if (charlieImgFile.exists()) {
                    helper.addInline("charlieImage", charlieImgFile);
                } else {
                    org.springframework.core.io.FileSystemResource charlieFs = new org.springframework.core.io.FileSystemResource(new java.io.File("frontend/public/images/charlie-ai.png"));
                    if (charlieFs.exists()) {
                        helper.addInline("charlieImage", charlieFs);
                    }
                }
            } catch (Exception e) {
                log.warn("Could not attach inline images to email: {}", e.getMessage());
            }

            mailSender.send(mimeMessage);
            log.info("HTML Report Card successfully sent to {}", toEmail);

        } catch (MessagingException e) {
            log.error("Failed to construct HTML email for {}: {}", toEmail, e.getMessage());
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
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            String websiteUrl = "https://learn-studio-2-0.vercel.app/";

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 40px 15px; }
                        .outer-bg { max-width: 640px; margin: 0 auto; background: #e2e8f0; padding: 25px; border-radius: 36px; position: relative; }
                        .card-wrapper { background: #ffffff; border-radius: 28px; padding: 40px 32px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08); position: relative; overflow: hidden; border: 1px solid rgba(0, 0, 0, 0.05); }
                        /* Memphis Organic Shapes */
                        .blob-yellow { position: absolute; top: -60px; right: -50px; width: 140px; height: 140px; background: #facc15; border-radius: 50%%; opacity: 0.85; }
                        .blob-red { position: absolute; top: -60px; left: -50px; width: 120px; height: 120px; background: #ff4d4d; border-radius: 40%% 60%% 70%% 30%% / 40%% 50%% 60%% 50%%; opacity: 0.85; }
                        .blob-blue { position: absolute; bottom: -50px; right: -20px; width: 160px; height: 160px; background: #2563eb; border-radius: 60%% 40%% 30%% 70%% / 60%% 30%% 70%% 40%%; opacity: 0.9; }
                        .blob-green { position: absolute; bottom: -40px; left: -30px; width: 130px; height: 130px; background: #10b981; border-radius: 50%% 50%% 20%% 80%% / 25%% 80%% 20%% 75%%; opacity: 0.85; }
                        .header-title { text-align: center; margin-bottom: 22px; padding-top: 20px; position: relative; z-index: 2; }
                        .welcome-text { font-size: 24px; font-weight: 900; letter-spacing: 8px; color: #0f172a; text-transform: uppercase; margin: 0; font-family: Georgia, 'Times New Roman', serif; }
                        .sub-text { font-size: 15px; font-weight: 800; color: #334155; margin-top: 6px; }
                        .divider { width: 50px; height: 3px; background: linear-gradient(90deg, #ff4d4d, #facc15, #2563eb); margin: 14px auto 20px auto; border-radius: 10px; }
                        .body-content { position: relative; z-index: 2; }
                        .greeting { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 14px; }
                        .msg-card { background: #f8fafc; border-left: 4px solid #2563eb; padding: 18px 20px; border-radius: 0 14px 14px 0; margin-bottom: 20px; }
                        .msg-eng { font-size: 14px; line-height: 1.65; color: #334155; margin-bottom: 8px; font-weight: 600; }
                        .msg-hin { font-size: 14px; line-height: 1.65; color: #475569; font-weight: 500; }
                        .cred-card { background: #ffffff; border: 2px solid #e2e8f0; border-radius: 20px; padding: 24px; margin: 24px 0; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.03); }
                        .cred-header { font-size: 11px; font-weight: 900; text-transform: uppercase; color: #2563eb; letter-spacing: 2px; margin-bottom: 16px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; }
                        .cred-field { margin-bottom: 12px; }
                        .cred-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
                        .cred-value { font-size: 15px; font-weight: 800; color: #0f172a; background: #f1f5f9; padding: 12px 16px; border-radius: 12px; font-family: monospace; display: block; word-break: break-all; }
                        .cta-wrap { text-align: center; margin: 30px 0 10px 0; }
                        .cta-btn { background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3); letter-spacing: 1px; }
                        .security-note { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 14px 18px; text-align: center; margin-top: 20px; }
                        .security-note p { margin: 0; font-size: 12px; color: #991b1b; font-weight: 600; line-height: 1.5; }
                        .footer { text-align: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; position: relative; z-index: 2; }
                        .footer-brand { font-size: 12px; font-weight: 800; color: #475569; letter-spacing: 1px; }
                        .footer-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
                    </style>
                </head>
                <body>
                    <div class="outer-bg">
                        <div class="card-wrapper">
                            <!-- Memphis Blobs -->
                            <div class="blob-yellow"></div>
                            <div class="blob-red"></div>
                            <div class="blob-blue"></div>
                            <div class="blob-green"></div>

                            <div class="header-title">
                                <h1 class="welcome-text">W E L C O M E</h1>
                                <div class="sub-text">Rk Coaching Classes.</div>
                                <div class="divider"></div>
                            </div>
                            
                            <div class="body-content">
                                <div class="greeting">Dear / प्रिय %s 👋</div>
                                
                                <div class="msg-card">
                                    <div class="msg-eng">
                                        We are excited to share that <strong>RK COACHING CLASSES</strong> has launched its official Digital Student Portal on <strong>LearnStudio 2.0</strong>! 🚀
                                    </div>
                                    <div class="msg-hin">
                                        आर.के. कोचिंग क्लासेस (<strong>RK COACHING CLASSES</strong>) का नया आधिकारिक डिजिटल स्टूडेंट पोर्टल (<strong>LearnStudio 2.0</strong>) अब लाइव हो चुका है! 🚀
                                    </div>
                                </div>

                                <div class="msg-card" style="border-left-color: #facc15;">
                                    <div class="msg-eng">
                                        A heartfelt thank you to all active students of <strong>%s</strong>! Your dedication and hard work drive our academic mission forward every single day. ❤️
                                    </div>
                                    <div class="msg-hin">
                                        <strong>%s</strong> के हमारे सभी एक्टिव और होनहार विद्यार्थियों का आर.के. कोचिंग परिवार की तरफ से सहृदय धन्यवाद! आपकी मेहनत और लगन ही हमारी सबसे बड़ी ताकत है। ❤️
                                    </div>
                                </div>

                                <div class="cred-card">
                                    <div class="cred-header">🔒 YOUR CONFIDENTIAL LOGIN CREDENTIALS / आपकी गोपनीय लॉगिन जानकारी</div>
                                    
                                    <div class="cred-field">
                                        <div class="cred-label">🌐 Official Website Link / पोर्टल लिंक</div>
                                        <div class="cred-value"><a href="%s" style="color: #2563eb; text-decoration: none;">%s</a></div>
                                    </div>
                                    
                                    <div class="cred-field">
                                        <div class="cred-label">👤 User ID (Email) / यूजर आईडी (ईमेल)</div>
                                        <div class="cred-value" style="color: #0284c7;">%s</div>
                                    </div>

                                    <div class="cred-field">
                                        <div class="cred-label">🔑 Password / पासवर्ड</div>
                                        <div class="cred-value" style="color: #dc2626;">%s</div>
                                    </div>

                                    <div class="google-note" style="margin-top: 14px; padding: 12px 14px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; font-size: 12px; color: #1e40af; font-weight: 600; line-height: 1.5;">
                                        💡 <strong>GOOGLE SIGN-IN:</strong> You can also log in directly using your registered Google Email!<br>
                                        💡 <strong>गूगल लॉगिन:</strong> आप अपने पंजीकृत गूगल ईमेल (Google Sign-In) का उपयोग करके भी सीधे लॉगिन कर सकते हैं।
                                    </div>
                                </div>

                                <div class="security-note">
                                    <p>🔒 <strong>CONFIDENTIAL & PRIVATE:</strong> These credentials belong strictly to you. Do NOT share your login details with anyone.<br>
                                    <strong>गोपनीय सूचना:</strong> यह पासवर्ड केवल आपके व्यक्तिगत उपयोग के लिए है। सुरक्षा के दृष्टिकोण से इसे किसी के साथ साझा न करें।</p>
                                </div>

                                <div class="cta-wrap">
                                    <a href="%s" class="cta-btn">🚀 LOGIN TO STUDENT PORTAL</a>
                                </div>
                            </div>

                            <div class="footer">
                                <div class="footer-brand">RK COACHING CLASSES • Powered by LearnStudio 2.0</div>
                                <div class="footer-sub">Academic Excellence & Digital Innovation • किसी भी सहायता के लिए संस्थान से संपर्क करें।</div>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            """.formatted(studentName, batchName != null ? batchName : "Class Batch", batchName != null ? batchName : "आपकी क्लास", websiteUrl, websiteUrl, userEmail, plainPassword, websiteUrl);

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("🎉 Welcome to RK COACHING CLASSES Digital Portal - Your Login Credentials");
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            log.info("Successfully sent welcome credentials email to student {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send welcome credentials email to {}: {}", toEmail, e.getMessage());
        }
    }
}
