package com.learnhub.repository;

import com.learnhub.entity.HomeworkSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface HomeworkSubmissionRepository extends JpaRepository<HomeworkSubmission, Long> {
    List<HomeworkSubmission> findByStudentId(Long studentId);
    List<HomeworkSubmission> findByHomeworkId(Long homeworkId);
    Optional<HomeworkSubmission> findByHomeworkIdAndStudentId(Long homeworkId, Long studentId);
}
