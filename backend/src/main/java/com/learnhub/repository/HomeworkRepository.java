package com.learnhub.repository;

import com.learnhub.entity.Homework;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

@Repository
public interface HomeworkRepository extends JpaRepository<Homework, Long> {
    List<Homework> findByCourseId(Long courseId);
    List<Homework> findByCourseIdAndIsVisibleTrue(Long courseId);
    List<Homework> findByLessonId(Long lessonId);
    List<Homework> findByBatchId(Long batchId);
    List<Homework> findByBatchIdAndSubjectName(Long batchId, String subjectName);
    boolean existsByPublicId(String publicId);
    java.util.Optional<Homework> findByPublicId(String publicId);
    List<Homework> findByCreatedById(Long createdById);

    @Query("SELECT h FROM Homework h WHERE h.course.id = :courseId AND h.isVisible = true AND (h.batch IS NULL OR h.batch.id = :batchId)")
    List<Homework> findByCourseIdAndBatchIdOrBatchNull(@Param("courseId") Long courseId, @Param("batchId") Long batchId);

    @Query("SELECT h FROM Homework h WHERE h.course.id = :courseId AND h.isVisible = true AND h.batch IS NULL")
    List<Homework> findByCourseIdAndBatchIsNull(@Param("courseId") Long courseId);
}
