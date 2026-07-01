package com.learnhub.repository;

import com.learnhub.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findAllByOrderByPinnedDescCreatedAtDesc();
    List<Announcement> findByTargetRoleInOrderByPinnedDescCreatedAtDesc(List<Announcement.TargetRole> targetRoles);
    List<Announcement> findByCourseIdAndTargetRoleInOrderByPinnedDescCreatedAtDesc(Long courseId, List<Announcement.TargetRole> targetRoles);
    List<Announcement> findByBatchIdOrderByPinnedDescCreatedAtDesc(Long batchId);
    List<Announcement> findByCreatedById(Long createdById);

    void deleteByBatchId(Long batchId);
}
