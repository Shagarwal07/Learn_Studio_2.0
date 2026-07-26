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
     */
    @Async
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

            // 4. Attach the logo inline
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
            } catch (Exception e) {
                log.warn("Could not attach logo to email: {}", e.getMessage());
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
