package com.learnhub.repository;

import com.learnhub.entity.GeneratedPaper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GeneratedPaperRepository extends JpaRepository<GeneratedPaper, Long> {
    List<GeneratedPaper> findByExamRequestId(Long requestId);
    List<GeneratedPaper> findByOrderByCreatedAtDesc();
}
