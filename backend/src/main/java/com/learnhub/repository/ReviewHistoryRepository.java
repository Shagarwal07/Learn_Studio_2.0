package com.learnhub.repository;

import com.learnhub.entity.ReviewHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewHistoryRepository extends JpaRepository<ReviewHistory, Long> {
    List<ReviewHistory> findByGeneratedPaperIdOrderByCreatedAtDesc(Long paperId);
}
