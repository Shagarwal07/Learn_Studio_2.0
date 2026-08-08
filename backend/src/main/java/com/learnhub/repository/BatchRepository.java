package com.learnhub.repository;

import com.learnhub.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface BatchRepository extends JpaRepository<Batch, Long> {
    
    Optional<Batch> findByName(String name);
    
    Optional<Batch> findByNameIgnoreCase(String name);
    
    List<Batch> findByInstructorsId(Long instructorId);

    List<Batch> findAll();

    Optional<Batch> findById(Long id);

    @Query("SELECT b.id, COUNT(s) FROM Batch b LEFT JOIN b.students s GROUP BY b.id")
    List<Object[]> countStudentsPerBatch();
}
