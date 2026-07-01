package com.learnhub.repository;

import com.learnhub.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BatchRepository extends JpaRepository<Batch, Long> {
    Optional<Batch> findByName(String name);
    Optional<Batch> findByNameIgnoreCase(String name);
    List<Batch> findByInstructorId(Long instructorId);
}
