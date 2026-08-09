package com.learnhub.repository;

import com.learnhub.entity.GeneratedPaper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GeneratedPaperRepository extends JpaRepository<GeneratedPaper, Long> {
    List<GeneratedPaper> findByExamRequestId(Long requestId);
    List<GeneratedPaper> findByOrderByCreatedAtDesc();

    @org.springframework.data.jpa.repository.Query("SELECT p FROM GeneratedPaper p JOIN p.examRequest e, Batch b JOIN b.instructors i WHERE e.course = b.name AND i.id = :instructorId ORDER BY p.createdAt DESC")
    List<GeneratedPaper> findByInstructorIdOrderByCreatedAtDesc(@org.springframework.data.repository.query.Param("instructorId") Long instructorId);
}
