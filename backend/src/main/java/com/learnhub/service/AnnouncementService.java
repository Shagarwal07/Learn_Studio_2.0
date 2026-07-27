package com.learnhub.service;

import com.learnhub.dto.AnnouncementDTO;
import com.learnhub.entity.Announcement;
import com.learnhub.entity.Course;
import com.learnhub.entity.User;
import com.learnhub.repository.AnnouncementRepository;
import com.learnhub.repository.CourseRepository;
import com.learnhub.repository.UserRepository;
import com.learnhub.repository.BatchRepository;
import com.learnhub.repository.EnrollmentRepository;
import com.learnhub.entity.Batch;
import com.learnhub.mapper.AnnouncementMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final BatchRepository batchRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AnnouncementMapper announcementMapper;
    private final EmailService emailService;

    @Transactional
    public AnnouncementDTO createAnnouncement(String email, AnnouncementDTO dto) {
        User creator = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Creator not found"));

        Course course = dto.courseId() != null 
                ? courseRepository.findById(dto.courseId()).orElse(null) 
                : null;

        Batch batch = dto.batchId() != null 
                ? batchRepository.findById(dto.batchId()).orElse(null) 
                : null;

        Announcement announcement = Announcement.builder()
                .title(dto.title())
                .message(dto.message())
                .imageUrl(dto.imageUrl())
                .targetRole(dto.targetRole() != null ? dto.targetRole() : Announcement.TargetRole.ALL)
                .course(course)
                .batch(batch)
                .instagramUrl(dto.instagramUrl())
                .externalLink(dto.externalLink())
                .pinned(dto.pinned() != null ? dto.pinned() : false)
                .createdBy(creator)
                .build();

        Announcement saved = announcementRepository.save(announcement);

        // Dispatch emails asynchronously
        dispatchAnnouncementEmails(saved);

        return announcementMapper.toDTO(saved);
    }

    private void dispatchAnnouncementEmails(Announcement announcement) {
        String batchName = announcement.getBatch() != null ? announcement.getBatch().getName() : 
                           announcement.getCourse() != null ? announcement.getCourse().getTitle() : "All Students";
        String instructorName = announcement.getCreatedBy().getName();

        List<User> targets;
        if (announcement.getBatch() != null) {
            targets = userRepository.findByBatchId(announcement.getBatch().getId());
        } else if (announcement.getCourse() != null) {
            targets = enrollmentRepository.findByCourseId(announcement.getCourse().getId()).stream()
                    .map(com.learnhub.entity.Enrollment::getUser)
                    .toList();
        } else {
            targets = userRepository.findByRole(User.Role.STUDENT);
        }

        for (User user : targets) {
            if (user.getRole() == User.Role.STUDENT && user.getEmail() != null) {
                emailService.sendHtmlAnnouncement(user.getEmail(), user.getName(), instructorName, batchName, announcement);
            }
        }
    }

    public List<AnnouncementDTO> getAnnouncements(String email, Long courseId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Announcement.TargetRole> targetRoles = switch (user.getRole()) {
            case STUDENT -> List.of(Announcement.TargetRole.ALL, Announcement.TargetRole.STUDENT);
            case INSTRUCTOR -> List.of(Announcement.TargetRole.ALL, Announcement.TargetRole.INSTRUCTOR);
            default -> List.of(Announcement.TargetRole.ALL, Announcement.TargetRole.STUDENT, Announcement.TargetRole.INSTRUCTOR);
        };

        List<Announcement> announcements;
        if (courseId != null) {
            announcements = announcementRepository.findByCourseIdAndTargetRoleInOrderByPinnedDescCreatedAtDesc(courseId, targetRoles);
        } else {
            announcements = announcementRepository.findByTargetRoleInOrderByPinnedDescCreatedAtDesc(targetRoles);
        }

        if (user.getRole() == User.Role.STUDENT) {
            List<Long> enrolledCourseIds = enrollmentRepository.findByUserId(user.getId()).stream()
                    .map(e -> e.getCourse().getId())
                    .toList();
            Long studentBatchId = user.getBatch() != null ? user.getBatch().getId() : null;

            announcements = announcements.stream().filter(a -> {
                if (a.getCourse() == null && a.getBatch() == null) return true;
                if (a.getCourse() != null && a.getBatch() == null) {
                    return enrolledCourseIds.contains(a.getCourse().getId());
                }
                if (a.getBatch() != null) {
                    return studentBatchId != null && a.getBatch().getId().equals(studentBatchId);
                }
                return false;
            }).toList();
        }

        return announcements.stream().map(announcementMapper::toDTO).toList();
    }

    public AnnouncementDTO getAnnouncementById(String email, Long id) {
        // Just verify user exists
        userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found"));

        return announcementMapper.toDTO(announcement);
    }

    @Transactional
    public AnnouncementDTO updateAnnouncement(String email, Long id, AnnouncementDTO dto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found"));

        // Only creator or admin can update
        if (user.getRole() != User.Role.ADMIN && !announcement.getCreatedBy().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        announcement.setTitle(dto.title());
        announcement.setMessage(dto.message());
        announcement.setImageUrl(dto.imageUrl());
        if (dto.targetRole() != null) {
            announcement.setTargetRole(dto.targetRole());
        }
        if (dto.pinned() != null) {
            announcement.setPinned(dto.pinned());
        }
        announcement.setInstagramUrl(dto.instagramUrl());
        announcement.setExternalLink(dto.externalLink());

        if (dto.courseId() != null) {
            Course course = courseRepository.findById(dto.courseId()).orElse(null);
            announcement.setCourse(course);
        } else if (dto.courseId() == null) {
            announcement.setCourse(null);
        }

        if (dto.batchId() != null) {
            Batch batch = batchRepository.findById(dto.batchId()).orElse(null);
            announcement.setBatch(batch);
        } else if (dto.batchId() == null) {
            announcement.setBatch(null);
        }

        return announcementMapper.toDTO(announcementRepository.save(announcement));
    }

    @Transactional
    public void deleteAnnouncement(String email, Long id) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found"));

        if (user.getRole() != User.Role.ADMIN && !announcement.getCreatedBy().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        announcementRepository.delete(announcement);
    }


}
