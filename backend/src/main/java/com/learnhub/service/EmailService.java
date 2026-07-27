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

    /**
     * Sends a simple text announcement to a student asynchronously.
     * @deprecated Use sendHtmlAnnouncement instead.
     */
    @Async
    @Deprecated
    public void sendAnnouncement(String toEmail, String subject, String message) {
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
}
