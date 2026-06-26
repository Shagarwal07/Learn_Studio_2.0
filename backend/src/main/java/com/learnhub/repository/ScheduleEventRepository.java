package com.learnhub.repository;

import com.learnhub.entity.ScheduleEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ScheduleEventRepository extends JpaRepository<ScheduleEvent, Long> {

    List<ScheduleEvent> findByEventDateBetweenOrderByEventDateAscStartTimeAsc(LocalDate startDate, LocalDate endDate);
    
    List<ScheduleEvent> findByInstructorIdOrderByEventDateAscStartTimeAsc(Long instructorId);
    
    List<ScheduleEvent> findByCreatedByIdOrderByEventDateAscStartTimeAsc(Long createdById);
}
