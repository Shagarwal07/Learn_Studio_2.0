package com.learnhub.repository;

import com.learnhub.entity.Homework;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HomeworkRepository extends JpaRepository<Homework, Long> {
    List<Homework> findByCourseId(Long courseId);
    List<Homework> findByCourseIdAndIsVisibleTrue(Long courseId);
    List<Homework> findByLessonId(Long lessonId);
    List<Homework> findByBatchId(Long batchId);
    List<Homework> findByBatchIdAndSubjectName(Long batchId, String subjectName);
    boolean existsByPublicId(String publicId);
}
