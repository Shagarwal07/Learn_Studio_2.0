package com.learnhub.service;

import com.learnhub.dto.AnnouncementDTO;
import com.learnhub.entity.Announcement;
import com.learnhub.entity.Course;
import com.learnhub.entity.User;
import com.learnhub.repository.AnnouncementRepository;
import com.learnhub.repository.CourseRepository;
import com.learnhub.repository.UserRepository;
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

    @Transactional
    public AnnouncementDTO createAnnouncement(String email, AnnouncementDTO dto) {
        User creator = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Creator not found"));

        Course course = dto.getCourseId() != null 
                ? courseRepository.findById(dto.getCourseId()).orElse(null) 
                : null;

        Announcement announcement = Announcement.builder()
                .title(dto.getTitle())
                .message(dto.getMessage())
                .imageUrl(dto.getImageUrl())
                .targetRole(dto.getTargetRole() != null ? dto.getTargetRole() : Announcement.TargetRole.ALL)
                .course(course)
                .instagramUrl(dto.getInstagramUrl())
                .externalLink(dto.getExternalLink())
                .pinned(dto.getPinned() != null ? dto.getPinned() : false)
                .createdBy(creator)
                .build();

        return toDTO(announcementRepository.save(announcement));
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

        return announcements.stream().map(this::toDTO).toList();
    }

    public AnnouncementDTO getAnnouncementById(String email, Long id) {
        // Just verify user exists
        userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found"));

        return toDTO(announcement);
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

        announcement.setTitle(dto.getTitle());
        announcement.setMessage(dto.getMessage());
        announcement.setImageUrl(dto.getImageUrl());
        if (dto.getTargetRole() != null) {
            announcement.setTargetRole(dto.getTargetRole());
        }
        if (dto.getPinned() != null) {
            announcement.setPinned(dto.getPinned());
        }
        announcement.setInstagramUrl(dto.getInstagramUrl());
        announcement.setExternalLink(dto.getExternalLink());

        if (dto.getCourseId() != null) {
            Course course = courseRepository.findById(dto.getCourseId()).orElse(null);
            announcement.setCourse(course);
        } else if (dto.getCourseId() == null) {
            announcement.setCourse(null);
        }

        return toDTO(announcementRepository.save(announcement));
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

    public AnnouncementDTO toDTO(Announcement announcement) {
        if (announcement == null) return null;
        return AnnouncementDTO.builder()
                .id(announcement.getId())
                .title(announcement.getTitle())
                .message(announcement.getMessage())
                .imageUrl(announcement.getImageUrl())
                .targetRole(announcement.getTargetRole())
                .courseId(announcement.getCourse() != null ? announcement.getCourse().getId() : null)
                .courseTitle(announcement.getCourse() != null ? announcement.getCourse().getTitle() : null)
                .instagramUrl(announcement.getInstagramUrl())
                .externalLink(announcement.getExternalLink())
                .pinned(announcement.getPinned())
                .createdById(announcement.getCreatedBy().getId())
                .createdByName(announcement.getCreatedBy().getName())
                .createdAt(announcement.getCreatedAt())
                .build();
    }
}
