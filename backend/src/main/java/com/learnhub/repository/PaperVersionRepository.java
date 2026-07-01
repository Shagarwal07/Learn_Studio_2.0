package com.learnhub.repository;

import com.learnhub.entity.PaperVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PaperVersionRepository extends JpaRepository<PaperVersion, Long> {
    List<PaperVersion> findByGeneratedPaperIdOrderByVersionDesc(Long paperId);
    List<PaperVersion> findByChangedById(Long changedById);
}
